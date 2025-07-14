#!/usr/bin/env node
/**
 * Main CLI interface for the URL to LLM-friendly Markdown converter.
 * 
 * JavaScript/Node.js equivalent of the Python cli.py module.
 */

const { Command } = require('commander');
const fs = require('fs').promises;
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
            disableWebSecurity: options.disableWebSecurity,
            viewportWidth: options.viewportWidth,
            viewportHeight: options.viewportHeight
        });

        if (!pageSource) {
            throw new Error('Failed to fetch the page. Ensure Chrome/Chromium is installed.');
        }

        // Build list of tags to remove
        let tagsToRemove = options.removeTags || [];
        
        // Add clean-content tags if option is enabled
        if (options.cleanContent) {
            const cleanContentTags = ['nav', 'footer', 'aside', 'script', 'style', 'header', 'noscript', 'canvas'];
            tagsToRemove = [...tagsToRemove, ...cleanContentTags];
        }

        // Process HTML to markdown
        const processed = await getProcessedMarkdown(pageSource, options.url, {
            keepImages: options.images !== false,
            keepWebpageLinks: options.links !== false,
            removeGifImage: options.gifImages === false,
            removeSvgImage: options.svgImages === false,
            removeTags: tagsToRemove
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
        .version('1.0.1')
        .argument('<url>', 'URL to fetch')
        .option('-o, --output <file>', 'Write output to file instead of stdout')
        .option('--no-links', 'Remove webpage links from the output')
        .option('--no-images', 'Remove images from the output')
        .option('--no-gif-images', 'Remove GIF images from the output')
        .option('--no-svg-images', 'Remove SVG images from the output')
        .option('--clean-content', 'Remove common non-content tags (nav, footer, aside, script, style, header, noscript, canvas)')
        .option('--remove-tags <tags...>', 'Remove specific HTML tags from the output (e.g., --remove-tags div span button)')
        .option('--wait <seconds>', 'Seconds to wait for the page to load', parseFloat, 1.5)
        .option('--show-browser', 'Show the browser window (visible mode)', false)
        .option('--mobile', 'Use mobile viewport (375x667 - iPhone)')
        .option('--tablet', 'Use tablet viewport (768x1024 - iPad portrait)')
        .option('--desktop', 'Use desktop viewport (1920x1080 - standard desktop)')
        .option('--viewport-width <width>', 'Set viewport width in pixels (320-1920)', (value) => parseInt(value, 10), 375)
        .option('--viewport-height <height>', 'Set viewport height in pixels (568-1080)', (value) => parseInt(value, 10), 667)
        .option('--disable-web-security', 'Disable web security (CORS) - use with caution for difficult sites', false)
        .action(async (url, options) => {
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

            // Handle viewport presets (presets override individual width/height options)
            if (options.mobile) {
                options.viewportWidth = 375;
                options.viewportHeight = 667;
            } else if (options.tablet) {
                options.viewportWidth = 768;
                options.viewportHeight = 1024;
            } else if (options.desktop) {
                options.viewportWidth = 1920;
                options.viewportHeight = 1080;
            }

            // Validate viewport dimensions
            if (options.viewportWidth < 320 || options.viewportWidth > 1920) {
                console.error('Error: Viewport width must be between 320 and 1920 pixels');
                process.exit(1);
            }
            if (options.viewportHeight < 568 || options.viewportHeight > 1080) {
                console.error('Error: Viewport height must be between 568 and 1080 pixels');
                process.exit(1);
            }

            // Check for conflicting viewport options
            const presetCount = [options.mobile, options.tablet, options.desktop].filter(Boolean).length;
            if (presetCount > 1) {
                console.error('Error: Only one viewport preset (--mobile, --tablet, or --desktop) can be used at a time');
                process.exit(1);
            }

            // Add URL to options object
            options.url = url;

            await run(options);
        });

    // Parse command line arguments
    program.showHelpAfterError();
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