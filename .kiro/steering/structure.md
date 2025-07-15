# Project Structure

## Root Directory Layout
```
├── src/                    # Source code
├── tests/                  # Test files and fixtures
├── coverage/               # Test coverage reports (generated)
├── node_modules/           # Dependencies (generated)
├── .kiro/                  # Kiro AI assistant configuration
├── .taskmaster/            # Task management system
├── package.json            # Project configuration and dependencies
├── jest.config.js          # Jest testing configuration
└── README.md               # Project documentation
```

## Source Code Organization (`src/`)
- **`index.js`** - Main CLI entry point with shebang, argument parsing, and orchestration
- **`lib/`** - Core library modules:
  - `pageFetcher.js` - Puppeteer-based web scraping functionality
  - `markdownProcessor.js` - HTML to Markdown conversion with Cheerio and Turndown

## Testing Structure (`tests/`)
- **Test files** follow `*.test.js` naming convention
- **`fixtures/`** directory contains test data:
  - `tables/` - HTML table test cases (9 different scenarios)
- **Coverage reports** generated in `/coverage` with HTML and lcov formats

## Configuration Files
- **`package.json`** - NPM package configuration, dependencies, scripts, and CLI binary definition
- **`jest.config.js`** - Jest test configuration with coverage settings
- **`.gitignore`** - Standard Node.js gitignore patterns
- **`.npmignore`** - NPM publish exclusions

## CLI Binary Configuration
- **Binary name**: `url-to-md` (defined in package.json bin field)
- **Entry point**: `src/index.js` with executable shebang
- **Global installation**: Supports `npm install -g` for system-wide CLI access

## Code Organization Patterns
- **Separation of concerns**: CLI logic, web scraping, and markdown processing are isolated
- **Module exports**: Each module exports specific functions using CommonJS
- **Error boundaries**: Each major function has try/catch error handling
- **Configuration objects**: Options passed as objects between modules for flexibility

## File Naming Conventions
- **Source files**: camelCase (e.g., `markdownProcessor.js`, `pageFetcher.js`)
- **Test files**: `*.test.js` suffix
- **Fixture files**: descriptive names with `.html` extension
- **Configuration files**: lowercase with standard extensions