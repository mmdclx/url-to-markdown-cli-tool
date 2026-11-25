const { lookup } = require('node:dns/promises');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const ipaddr = require('ipaddr.js');

const SOCKET_TIMEOUT = 30_000;
const GLOBAL_IPV6 = ipaddr.parseCIDR('2000::/3');
const PRIVATE_RANGES = new Set(['private', 'loopback', 'uniqueLocal']);
const CONNECTION_HEADERS = [
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade'
];

function parseWebUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error('Invalid URL provided');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS URLs are supported');
    }
    if (url.username || url.password) {
        throw new Error('URLs with embedded credentials are not supported');
    }
    return url;
}

async function destinationFor(url, privateOrigin) {
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const family = net.isIP(hostname);
    const addresses = family ? [{ address: hostname, family }] : await lookup(hostname, { all: true });
    const allowPrivate = url.origin === privateOrigin;
    const blocked = addresses.some(({ address }) => {
        const ip = ipaddr.process(address);
        const range = ip.range();
        if (allowPrivate && PRIVATE_RANGES.has(range)) {
            return false;
        }
        return range !== 'unicast' || (ip.kind() === 'ipv6' && !ip.match(GLOBAL_IPV6));
    });
    if (blocked || addresses.length === 0) {
        throw new Error(`Blocked browser destination ${url.origin}: address is not public`);
    }

    return {
        host: hostname,
        // Use only the vetted addresses, including when Node tries a second address family.
        lookup: (_hostname, options, callback) => {
            if (options.all) {
                callback(null, addresses);
            } else {
                callback(null, addresses[0].address, addresses[0].family);
            }
        }
    };
}

function endToEndHeaders(headers) {
    const forwarded = { ...headers };
    const namedHeaders = (headers.connection ?? '').toLowerCase().split(',');
    for (const name of [...CONNECTION_HEADERS, ...namedHeaders]) {
        delete forwarded[name.trim()];
    }
    return forwarded;
}

async function forwardHttp(request, response, privateOrigin) {
    const url = parseWebUrl(request.url);
    if (url.protocol !== 'http:') {
        throw new Error('HTTPS requires a CONNECT tunnel');
    }
    const destination = await destinationFor(url, privateOrigin);
    if (response.destroyed) {
        return;
    }

    const upstream = http.request({
        ...destination,
        port: url.port || 80,
        method: request.method,
        path: url.pathname + url.search,
        headers: { ...endToEndHeaders(request.headers), host: url.host },
        agent: false,
        timeout: SOCKET_TIMEOUT
    }, (incoming) => {
        response.writeHead(incoming.statusCode, endToEndHeaders(incoming.headers));
        incoming.on('error', () => response.destroy());
        incoming.pipe(response);
    });
    upstream.on('timeout', () => upstream.destroy());
    upstream.on('error', () => response.destroy());
    response.on('close', () => upstream.destroy());
    request.pipe(upstream);
}

async function connectTunnel(request, client, head, privateOrigin) {
    if (!/^[^/?#@\\]+:\d+$/.test(request.url)) {
        throw new Error('Invalid CONNECT authority');
    }
    const url = parseWebUrl(`https://${request.url}`);
    const destination = await destinationFor(url, privateOrigin);
    if (client.destroyed) {
        return;
    }

    const upstream = net.connect({ ...destination, port: Number(url.port || 443) });
    upstream.setTimeout(SOCKET_TIMEOUT, () => upstream.destroy());
    upstream.on('error', () => client.destroy());
    upstream.on('close', () => client.destroy());
    client.on('close', () => upstream.destroy());
    upstream.once('connect', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        upstream.write(head);
        client.pipe(upstream).pipe(client);
    });
}

async function startBrowserProxy(url, allowPrivateNetwork) {
    const privateOrigin = allowPrivateNetwork ? url.origin : undefined;
    await destinationFor(url, privateOrigin);

    // Check each connection at the proxy so redirects, frames and worker requests share the policy.
    const clients = new Set();
    const server = http.createServer((request, response) => {
        forwardHttp(request, response, privateOrigin).catch(() => response.destroy());
    });
    server.maxConnections = 128;
    server.on('connection', (client) => {
        clients.add(client);
        client.setTimeout(SOCKET_TIMEOUT, () => client.destroy());
        client.on('error', () => client.destroy());
        client.on('close', () => clients.delete(client));
    });
    server.on('connect', (request, client, head) => {
        connectTunnel(request, client, head, privateOrigin).catch(() => client.destroy());
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    return {
        endpoint: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((resolve) => {
            server.close(resolve);
            for (const client of clients) {
                client.destroy();
            }
        })
    };
}

module.exports = { parseWebUrl, startBrowserProxy };
