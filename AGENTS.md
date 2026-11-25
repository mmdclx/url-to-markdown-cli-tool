# AGENTS.md

Purpose
- Node.js CLI that converts web pages into clean, LLM-friendly markdown.
- Fetches pages via Puppeteer, strips noise, and converts HTML to markdown.
- No external APIs or keys required.

Structure
- `src/index.js`: CLI entry point and option parsing.
- `src/lib/pageFetcher.js`: Puppeteer fetching.
- `src/lib/markdownProcessor.js`: HTML to markdown conversion.
- `tests/`: Jest tests with fixtures in `tests/fixtures/`.

Tech
- Node.js >= 22.12.
- Core deps: puppeteer, cheerio, turndown, commander.
- Tests: jest (`npm test`).
