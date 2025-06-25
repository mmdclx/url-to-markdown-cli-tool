#!/usr/bin/env node
/**
 * Main CLI interface for the URL to LLM-friendly Markdown converter.
 * 
 * JavaScript/Node.js equivalent of the Python cli.py module.
 */

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { getPageSource } = require('./lib/pageFetcher');
const { getProcessedMarkdown } = require('./lib/markdownProcessor');

/**
 * Main execution function
 * @param {Object} options - CLI options object
 */
async function run(options) {
    try {
        // Fetch page source
        const pageSource = await getPageSource(options.url, {
            wait: options.wait,
            headless: !options.showBrowser,
            showBrowser: options.showBrowser,
            disableWebSecurity: options.disableWebSecurity
        });

        if (!pageSource) {
            throw new Error('Failed to fetch the page. Ensure Chrome/Chromium is installed.');
        }

        // Process HTML to markdown
        const processed = await getProcessedMarkdown(pageSource, options.url, {
            keepImages: options.images !== false,
            keepWebpageLinks: options.links !== false,
            removeGifImage: options.gifImages === false,
            removeSvgImage: options.svgImages === false,
            removeTags: options.removeTags || []
        });

        // Output result
        if (options.output) {
            await fs.writeFile(options.output, processed, 'utf-8');
            console.log(`Output written to: ${options.output}`);
        } else {
            console.log(processed);
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Main function to set up CLI and parse arguments
 */
function main() {
    const program = new Command();

    program
        .name('url-to-md')
        .description('Fetch URL content and output LLM-friendly markdown')
        .version('1.0.0')
        .argument('<url>', 'URL to fetch')
        .option('-o, --output <file>', 'Write output to file instead of stdout')
        .option('--wait <seconds>', 'Seconds to wait for the page to load', parseFloat, 1.5)
        .option('--show-browser', 'Show the browser window (visible mode)', false)
        .option('--disable-web-security', 'Disable web security (CORS) - use with caution for difficult sites', false)
        .option('--no-images', 'Remove images from the output')
        .option('--no-links', 'Remove webpage links from the output')
        .option('--no-gif-images', 'Remove GIF images from the output')
        .option('--no-svg-images', 'Remove SVG images from the output')
        .option('--remove-tags <tags...>', 'Remove specific HTML tags from the output (e.g., --remove-tags div span script)')
        .action(async (url, options) => {
            // Handle deprecated --no-headless flag
            if (options.noHeadless) {
                console.warn('Warning: --no-headless is deprecated. Use --show-browser instead.');
                options.showBrowser = true;
            }

            // Validate URL
            try {
                new URL(url);
            } catch (error) {
                console.error(`Error: Invalid URL provided: ${url}`);
                process.exit(1);
            }

            // Validate wait time
            if (options.wait < 0) {
                console.error('Error: Wait time must be non-negative');
                process.exit(1);
            }

            // Add URL to options object
            options.url = url;

            await run(options);
        });

    // Parse command line arguments
    program.parse();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
});

// Run the CLI if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    run,
    main
};