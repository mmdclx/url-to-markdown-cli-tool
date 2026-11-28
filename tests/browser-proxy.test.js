jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const { lookup } = require('node:dns/promises');
const { parseWebUrl, startBrowserProxy } = require('../src/lib/browserProxy');

test('rejects a hostname with both public and private DNS answers', async () => {
    lookup.mockResolvedValueOnce([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.1', family: 4 }
    ]);

    await expect(startBrowserProxy(parseWebUrl('https://docs.example.test')))
        .rejects.toThrow('Blocked browser destination');
    expect(lookup).toHaveBeenCalledWith('docs.example.test', { all: true });
});

test.each([
    ['http://[::ffff:127.0.0.1]', false],
    ['http://[fc00::1]', false],
    ['http://[fe80::1]', true],
    ['http://192.0.2.1', true]
])('rejects non-public destination %s with private opt-in set to %s', async (url, allowPrivate) => {
    await expect(startBrowserProxy(parseWebUrl(url), allowPrivate))
        .rejects.toThrow('Blocked browser destination');
});

test('does not start listening if the capture is canceled during DNS lookup', async () => {
    let resolveLookup;
    lookup.mockImplementationOnce(() => new Promise(resolve => { resolveLookup = resolve; }));
    const controller = new AbortController();
    const proxy = startBrowserProxy(parseWebUrl('https://docs.example.test'), false, controller.signal);

    controller.abort(new Error('Capture canceled'));
    resolveLookup([{ address: '93.184.216.34', family: 4 }]);

    await expect(proxy).rejects.toThrow('Capture canceled');
});
