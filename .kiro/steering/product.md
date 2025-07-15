# Product Overview

**url-to-markdown-cli-tool** is a Node.js CLI tool that converts web pages into clean, LLM-friendly markdown format.

## Core Purpose
- Fetches web content using Puppeteer browser automation
- Strips away noise (ads, navigation, scripts, styling) 
- Converts HTML to properly formatted markdown optimized for LLM consumption
- No API keys or external services required

## Key Features
- Smart content cleaning with configurable tag removal
- Enhanced table conversion with proper markdown table formatting
- Viewport control (mobile, tablet, desktop) for responsive content
- Image and link filtering options
- Configurable wait times for dynamic/SPA content
- Headless or visible browser modes for debugging

## Target Use Cases
- **AI/ML**: Training data preparation, RAG systems, content curation
- **Documentation**: Knowledge base creation, content migration
- **Research**: Academic paper extraction, content archival
- **Content Processing**: Batch URL processing for AI pipelines

## Output Quality
The tool prioritizes clean, structured markdown that maintains document hierarchy (headers, lists, tables) while removing visual noise that doesn't contribute to content understanding.