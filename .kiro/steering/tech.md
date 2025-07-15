# Technology Stack

## Runtime & Language
- **Node.js** 18.0.0+ (specified in package.json engines)
- **JavaScript** (ES6+ features, async/await patterns)
- **CLI Tool** with global npm installation support

## Core Dependencies
- **puppeteer** (^23.0.0) - Browser automation for web scraping
- **cheerio** (^1.0.0-rc.12) - Server-side HTML manipulation and parsing
- **turndown** (^7.2.0) - HTML to Markdown conversion engine
- **commander** (^12.0.0) - CLI argument parsing and command structure

## Development Dependencies
- **jest** (^29.0.0) - Testing framework with coverage reporting

## Build System & Scripts
```bash
# Development and testing
npm run start          # Run the CLI tool directly
npm run dev            # Development mode (same as start)
npm test               # Run Jest test suite
npm install -g .       # Install CLI globally for development

# Production usage
npm install -g url-to-markdown-cli-tool
url-to-md <url> [options]
```

## Testing Strategy
- **Jest** for unit and integration testing
- **Fixture-based testing** for HTML table conversion scenarios
- **Coverage reporting** with lcov and HTML reports in `/coverage`
- Test files located in `/tests` directory
- Comprehensive table conversion test suite with 9 different HTML scenarios

## Browser Requirements
- **Chrome/Chromium** browser must be installed and accessible in PATH
- Puppeteer handles browser lifecycle automatically
- Supports both headless and visible browser modes

## Architecture Patterns
- **Modular design** with separate concerns:
  - `src/index.js` - CLI interface and argument parsing
  - `src/lib/pageFetcher.js` - Web scraping with Puppeteer
  - `src/lib/markdownProcessor.js` - HTML to Markdown conversion
- **Error handling** with try/catch blocks and graceful degradation
- **Async/await** throughout for clean asynchronous code
- **Configuration-driven** processing with extensive options