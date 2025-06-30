# url-to-markdown-cli-tool

A Node.js CLI tool that converts web pages into clean, LLM-friendly markdown format. It fetches web content using Puppeteer and strips away noise like ads, navigation elements, and unnecessary formatting, leaving you with properly formatted markdown that's perfect for feeding into large language models, RAG systems, or AI training datasets. 

No LLM or API keys required.

**Key features:**
- 🔄 Convert any webpage to properly formatted markdown with headers, links, and structure
- 🧹 **Smart content cleaning** - Remove navigation, footers, scripts and other non-content elements
- 🚫 Remove images, links, or specific HTML tags as needed
- 📊 **Enhanced table conversion** - HTML tables become clean markdown tables with pipes and headers
- 📱 **Viewport control** - Mobile, tablet, desktop viewports for responsive content extraction
- ⏱️ Configurable wait times for dynamic content and SPAs
- 👁️ Headless or visible browser modes for debugging
- 📦 Easy npm installation with global CLI access
- 🧠 Clean output optimized for LLM parsing and understanding
- ⚡ Fast Node.js implementation with Puppeteer browser automation

## Quick Install

```bash
npm install -g url-to-markdown-cli-tool
```

Then immediately get started:
```bash
url-to-md https://example.com -o example.md
```

## Installation

### Via npm (When published)

```bash
# Install globally to use anywhere
npm install -g url-to-markdown-cli-tool

# Or install locally in your project
npm install url-to-markdown-cli-tool
```

### From Source (Current)

```bash
# Clone and install from this repository
git clone https://github.com/yourusername/url-to-markdown-cli-tool.git
cd url-to-markdown-cli-tool
npm install
npm install -g .
```

### System Requirements

- **Node.js** 18.0.0 or higher
- **Google Chrome or Chromium** browser installed and accessible in PATH

Chrome/Chromium will be automatically detected.

## Usage

```bash
# Convert a webpage to markdown file
url-to-md https://example.com -o example.md

# Smart content cleaning - removes nav, footer, aside, script, style, header, noscript, canvas
url-to-md https://blog.example.com --clean-content -o clean-blog.md

# Output to console
url-to-md https://example.com

# Get help
url-to-md --help
```

### Content Filtering
```bash
# Smart content cleaning - removes nav, footer, aside, script, style, header, noscript, canvas
url-to-md https://blog.example.com --clean-content -o clean-blog.md

# Remove all images
url-to-md https://blog.example.com --no-images -o clean-blog.md

# Remove webpage links (keep text, remove hyperlinks)
url-to-md https://article.com --no-links -o text-only.md

# Remove specific image types
url-to-md https://site.com --no-gif-images --no-svg-images

# Remove specific HTML tags manually
url-to-md https://site.com --remove-tags nav footer aside script
```

### Viewport Configuration
```bash
# Use mobile viewport for responsive sites (375x667 - iPhone)
url-to-md https://example.com --mobile -o mobile-view.md

# Use tablet viewport (768x1024 - iPad portrait)
url-to-md https://example.com --tablet -o tablet-view.md

# Use desktop viewport (1920x1080 - standard desktop)
url-to-md https://example.com --desktop -o desktop-view.md

# Custom viewport dimensions
url-to-md https://example.com --viewport-width 1200 --viewport-height 800 -o custom-view.md
```

### Advanced Options
```bash
# Debug with visible browser to see content loading
url-to-md https://dynamic-site.com --show-browser --wait 5.0

# Maximum cleanup
url-to-md https://article.com \
  --clean-content \
  --no-images \
  --no-links \
  --wait 3.0 \
  -o clean-article.md

# Disable web security for difficult sites (use with caution)
url-to-md https://cors-protected-site.com --disable-web-security
```

### Batch Processing & Automation
```bash
# Batch processing with error handling
for url in $(cat urls.txt); do
  echo "Processing: $url"
  url-to-md "$url" -o "output/$(basename $url).md" || echo "Failed: $url"
done


## Full command Line Options

```
Usage: url-to-md [options] <url>

Fetch URL content and output LLM-friendly markdown

Arguments:
  url                              URL to fetch

Options:
  -V, --version                    output the version number
  -o, --output <file>              Write output to file instead of stdout
  --no-links                       Remove webpage links from the output
  --no-images                      Remove images from the output
  --no-gif-images                  Remove GIF images from the output  
  --no-svg-images                  Remove SVG images from the output
  --clean-content                  Remove common non-content tags (nav, footer, aside, script, style, header, noscript, canvas)
  --remove-tags <tags...>          Remove specific HTML tags (e.g., --remove-tags div span)
  --wait <seconds>                 Seconds to wait for page to load (default: 1.5)
  --show-browser                   Show browser window (visible mode)
  --mobile                         Use mobile viewport (375x667 - iPhone)
  --tablet                         Use tablet viewport (768x1024 - iPad portrait)
  --desktop                        Use desktop viewport (1920x1080 - standard desktop)
  --viewport-width <width>         Set viewport width in pixels (320-1920, default: 375)
  --viewport-height <height>       Set viewport height in pixels (568-1080, default: 667)
  --disable-web-security           Disable web security (CORS) - use with caution for difficult sites
  -h, --help                       display help for command
```

## Troubleshooting

### Content Not Fully Extracted?

Many modern websites use **JavaScript to load content dynamically** after the initial page loads. If you're only seeing partial content, loading spinners, or placeholder text, the website likely renders its main content using JavaScript.

**Solutions:**

1. **Increase wait time** for slow-loading content:
   ```bash
   # Wait 5 seconds for JavaScript content to load
   url-to-md https://spa-app.com --wait 5.0
   ```

2. **Debug with visible browser** to see what's happening:
   ```bash
   # Watch the page load in a visible browser window
   url-to-md https://dynamic-site.com --show-browser --wait 5.0
   ```

### Common Issues

#### "Permission denied" errors
```bash
# On Linux/macOS, make sure the binary is executable
chmod +x /usr/local/bin/url-to-md

# Or reinstall globally
npm uninstall -g url-to-markdown-cli-tool
npm install -g url-to-markdown-cli-tool
```

#### Network timeout errors
```bash
# Increase wait time for slow networks
url-to-md https://example.com --wait 10.0
```

## Use Cases

### 🤖 AI & Machine Learning
- **Training Data**: Extract clean text from web articles for LLM training
- **RAG Systems**: Convert documentation and articles for vector databases  
- **Content Curation**: Batch process URLs for AI content pipelines
- **Structured Data**: Extract tables and structured content in markdown format

### 📚 Documentation & Research
- **Knowledge Base**: Convert external docs to consistent markdown format
- **Research**: Extract academic papers and articles for analysis
- **Archival**: Preserve web content in clean, readable format

### 🔄 Content Migration
- **CMS Migration**: Extract content from old websites
- **Documentation Sites**: Convert existing content to markdown-based docs
- **Static Site Generation**: Process dynamic content for static sites

**Perfect for:** RAG systems, LLM training data preparation, documentation extraction, table data extraction, and any workflow that needs clean, structured text from web content.


## Acknowledgments

- Originally inspired by [m92vyas/llm-reader](https://github.com/m92vyas/llm-reader), a Python library
- Built with [Puppeteer](https://pptr.dev/) for reliable browser automation
- Uses [Cheerio](https://cheerio.js.org/) for server-side HTML manipulation
- Powered by [Turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion

---

