/**
 * Page fetcher module for retrieving web content using Puppeteer.
 * 
 * JavaScript/Node.js equivalent of the Python page_fetcher.py module.
 * Originally inspired by m92vyas/llm-reader.
 */

const puppeteer = require('puppeteer');

/**
 * Get HTML source using Puppeteer.
 * 
 * @param {string} url - The URL from which HTML content is to be extracted
 * @param {Object} options - Configuration options
 * @param {number} [options.wait=1.5] - Time to wait for the website to load (seconds)
 * @param {boolean} [options.headless=true] - Use headless browser or not
 * @param {string} [options.userAgent] - User agent string for the browser
 * @param {boolean} [options.showBrowser=false] - Show browser window (opposite of headless)
 * @param {boolean} [options.disableWebSecurity=false] - Disable web security (CORS) - use with caution
 * @returns {Promise<string>} HTML source code of the page
 * @throws {Error} If there's an error while fetching the page
 */
async function getPageSource(url, options = {}) {
    const {
        wait = 1.5,
        headless = true,
        showBrowser = false,
        disableWebSecurity = false,
        userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    } = options;

    // showBrowser overrides headless setting
    const isHeadless = showBrowser ? false : headless;

    let browser = null;
    try {
        // Launch browser with secure Chrome options
        const args = [
            '--disable-dev-shm-usage', // Required for Docker/CI environments
            '--disable-features=VizDisplayCompositor'
        ];
        
        // Only disable web security if explicitly requested (use with caution)
        if (disableWebSecurity) {
            args.push('--disable-web-security');
        }
        
        browser = await puppeteer.launch({
            headless: isHeadless ? 'new' : false,
            args
        });

        const page = await browser.newPage();
        
        // Set modern viewport for better compatibility
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set user agent
        await page.setUserAgent(userAgent);
        
        // Navigate to the URL and wait for DOM content to load
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 // 30 second timeout
        });
        
        // Wait for the specified time (equivalent to Python's implicit wait)
        if (wait > 0) {
            await new Promise(resolve => setTimeout(resolve, wait * 1000));
        }
        
        // Wait for page to be fully loaded (handles dynamic content)
        try {
            await page.waitForFunction(
                () => document.readyState === 'complete',
                { timeout: Math.max(wait * 1000, 5000) } // Minimum 5 seconds for readyState check
            );
        } catch (timeoutError) {
            // Continue anyway if timeout - some content is better than none
            console.warn('Page load timeout, continuing with partial content');
        }
        
        // Get the full HTML source
        return await page.content();

    } catch (error) {
        throw new Error(`Error while fetching page: ${error.message}. Ensure Chrome/Chromium is installed.`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    getPageSource
};