/**
 * Page fetcher module for retrieving web content using Puppeteer.
 * 
 * JavaScript/Node.js equivalent of the Python page_fetcher.py module.
 * Originally inspired by m92vyas/llm-reader.
 */

const puppeteer = require('puppeteer');
const { parseWebUrl, startBrowserProxy } = require('./browserProxy');

function throwForHttpError(response) {
    const status = response?.status();
    if (status >= 400) {
        throw new Error(`HTTP ${status} for ${response.url()}`);
    }
}

/**
 * Capture a page and its document base URL using Puppeteer.
 * 
 * @param {string} url - The URL from which HTML content is to be extracted
 * @param {Object} options - Configuration options
 * @param {number} [options.wait] - Extra delay before checking page readiness (seconds)
 * @param {string} [options.waitFor] - CSS selector that must match before capture
 * @param {number} [options.waitForTimeout=30] - Maximum time to wait for a selector (seconds)
 * @param {boolean} [options.headless=true] - Use headless browser or not
 * @param {string} [options.userAgent] - User agent string for the browser
 * @param {boolean} [options.showBrowser=false] - Show browser window (opposite of headless)
 * @param {boolean} [options.allowPrivateNetwork=false] - Allow private or loopback addresses for the requested origin
 * @param {number} [options.viewportWidth=375] - Viewport width in pixels (320-1920)
 * @param {number} [options.viewportHeight=667] - Viewport height in pixels (568-1080)
 * @returns {Promise<{html: string, baseUrl: string}>} HTML and base URL from the same document
 * @throws {Error} If there's an error while fetching the page
 */
async function fetchPage(url, options = {}) {
    const {
        waitFor,
        wait = waitFor ? 0 : 1.5,
        waitForTimeout = 30,
        headless = true,
        showBrowser = false,
        allowPrivateNetwork = false,
        userAgent,
        viewportWidth = 375,
        viewportHeight = 667
    } = options;

    // Validate viewport dimensions
    if (viewportWidth < 320 || viewportWidth > 1920) {
        throw new Error('Viewport width must be between 320 and 1920 pixels');
    }
    if (viewportHeight < 568 || viewportHeight > 1080) {
        throw new Error('Viewport height must be between 568 and 1080 pixels');
    }

    // showBrowser overrides headless setting
    const isHeadless = showBrowser ? false : headless;

    const targetUrl = parseWebUrl(url);
    const proxy = await startBrowserProxy(targetUrl, allowPrivateNetwork);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: isHeadless,
            pipe: true,
            downloadBehavior: { policy: 'deny' },
            allowlist: [
                'http://*:*/*', 'https://*:*/*', 'ws://*:*/*', 'wss://*:*/*',
                'about\\:blank', 'about\\:srcdoc', 'blob:*', 'data:*'
            ],
            args: [
                '--disable-dev-shm-usage',
                `--proxy-server=${proxy.endpoint}`,
                '--proxy-bypass-list=<-loopback>',
                '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                '--disable-quic',
                '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport with configurable dimensions (defaults to mobile-first)
        await page.setViewport({ width: viewportWidth, height: viewportHeight });
        
        // Set user agent
        if (userAgent) {
            await page.setUserAgent({ userAgent });
        }
        
        let documentResponse;
        page.on('response', (response) => {
            const request = response.request();
            if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
                documentResponse = response;
            }
        });

        try {
            await page.goto(targetUrl.href, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        } finally {
            throwForHttpError(documentResponse);
        }
        
        // Wait for the specified time (equivalent to Python's implicit wait)
        if (wait > 0) {
            await new Promise(resolve => setTimeout(resolve, wait * 1000));
        }
        
        if (waitFor) {
            try {
                await page.waitForFunction(
                    selector => document.querySelector(selector) !== null,
                    { timeout: waitForTimeout * 1000 },
                    waitFor
                );
            } catch (error) {
                throwForHttpError(documentResponse);
                if (error instanceof puppeteer.TimeoutError) {
                    throw new Error(`Timed out after ${waitForTimeout}s waiting for CSS selector ${JSON.stringify(waitFor)}`);
                }
                throw error;
            }
        } else {
            try {
                await page.waitForFunction(
                    () => document.readyState === 'complete',
                    { timeout: Math.max(wait * 1000, 5000) }
                );
            } catch (timeoutError) {
                console.warn('Page load timeout, continuing with partial content');
            }
        }
        
        // A client-side redirect can replace the main document while the page loads.
        throwForHttpError(documentResponse);
        const captured = await page.evaluate(() => {
            const serializer = new XMLSerializer();
            let html = '';
            for (const node of document.childNodes) {
                html += node === document.documentElement ? node.outerHTML : serializer.serializeToString(node);
            }
            return { html, baseUrl: document.baseURI };
        });
        throwForHttpError(documentResponse);
        return captured;

    } catch (error) {
        throw new Error(`Error while fetching page: ${error.message}`, { cause: error });
    } finally {
        try {
            await browser?.close();
        } finally {
            await proxy.close();
        }
    }
}

async function getPageSource(url, options) {
    return (await fetchPage(url, options)).html;
}

module.exports = {
    fetchPage,
    getPageSource
};
