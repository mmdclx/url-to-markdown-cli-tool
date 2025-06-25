# url-to-llm-friendly-md

A Node.js CLI tool that converts web pages into clean, LLM-friendly markdown format. It fetches web content using Puppeteer and strips away noise like ads, navigation elements, and unnecessary formatting, leaving you with properly formatted markdown that's perfect for feeding into large language models, RAG systems, or AI training datasets.

**Key features:**
- 🔄 Convert any webpage to properly formatted markdown with headers, links, and structure
- 🚫 Remove images, links, or specific HTML tags as needed
- ⏱️ Configurable wait times for dynamic content and SPAs
- 👁️ Headless or visible browser modes for debugging
- 📦 Easy npm installation with global CLI access
- 🧠 Clean output optimized for LLM parsing and understanding
- ⚡ Fast Node.js implementation with Puppeteer browser automation

## Installation

### Via npm (Recommended)

```bash
# Install globally to use anywhere
npm install -g url-to-llm-friendly-md

# Or install locally in your project
npm install url-to-llm-friendly-md
```

### System Requirements

- **Node.js** 18.0.0 or higher
- **Google Chrome or Chromium** browser installed and accessible in PATH

Chrome/Chromium will be automatically detected. If you don't have Chrome installed:

**macOS:**
```bash
brew install --cask google-chrome
```

**Ubuntu/Debian:**
```bash
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update && apt-get install google-chrome-stable
```

**Windows:**
Download from [https://www.google.com/chrome/](https://www.google.com/chrome/)

## Quick Start

```bash
# Convert a webpage to markdown file
url-to-md https://example.com -o example.md

# Output to console
url-to-md https://news.ycombinator.com

# Get help
url-to-md --help
```

## Usage

### Basic Conversion
```bash
# Convert a webpage to markdown file
url-to-md https://example.com -o example.md

# Output to console (stdout)
url-to-md https://news.ycombinator.com

# Convert with custom wait time for dynamic content
url-to-md https://spa-app.com --wait 3.0 -o spa-content.md
```

### Content Filtering
```bash
# Remove all images
url-to-md https://blog.example.com --no-images -o clean-blog.md

# Remove webpage links (keep text, remove hyperlinks)
url-to-md https://article.com --no-links -o text-only.md

# Remove specific image types
url-to-md https://site.com --no-gif-images --no-svg-images

# Remove specific HTML tags (navigation, footers, etc.)
url-to-md https://site.com --remove-tags nav footer aside script
```

### Advanced Options
```bash
# Debug with visible browser to see content loading
url-to-md https://dynamic-site.com --show-browser --wait 5.0

# Maximum cleanup for LLM processing
url-to-md https://article.com \\
  --no-images \\
  --no-links \\
  --remove-tags nav footer aside script style \\
  --wait 3.0 \\
  -o clean-article.md

# Process single-page applications (SPAs)
url-to-md https://react-app.com --wait 5.0 --show-browser
```

### Batch Processing & Automation
```bash
# Batch processing with error handling
for url in $(cat urls.txt); do
  echo "Processing: $url"
  url-to-md "$url" -o "output/$(basename $url).md" || echo "Failed: $url"
done

# Use in npm scripts
{
  "scripts": {
    "fetch-docs": "url-to-md https://docs.api.com --no-images -o docs/api.md"
  }
}

# CI/CD documentation updates
url-to-md https://docs.internal.com/api \\
  --no-images \\
  --remove-tags nav sidebar \\
  -o docs/api-reference.md
```

### Pipeline Integration

```bash
# Convert multiple URLs and combine
cat urls.txt | while read url; do
  url-to-md "$url" --no-images --no-links
  echo -e "\\n---\\n"
done > combined-content.md

# Extract specific content for AI training
url-to-md https://wikipedia.org/wiki/Machine_Learning \\
  --no-images \\
  --remove-tags nav footer sidebar \\
  -o training-data/ml-article.md
```

## Command Line Options

```
Usage: url-to-md [options] <url>

Fetch URL content and output LLM-friendly markdown

Arguments:
  url                      URL to fetch

Options:
  -V, --version            output the version number
  -o, --output <file>      Write output to file instead of stdout
  --wait <seconds>         Seconds to wait for page to load (default: 1.5)
  --show-browser           Show browser window (visible mode)
  --no-images              Remove images from the output
  --no-links               Remove webpage links from the output
  --no-gif-images          Remove GIF images from the output  
  --no-svg-images          Remove SVG images from the output
  --remove-tags <tags...>  Remove specific HTML tags (e.g., --remove-tags div span)
  -h, --help               display help for command
```

## Troubleshooting

### Content Not Fully Extracted?

Many modern websites use **JavaScript to load content dynamically** after the initial page loads. If you're only seeing partial content, loading spinners, or placeholder text, the website likely renders its main content using JavaScript.

**Examples of dynamic content:**
- Single Page Applications (SPAs) built with React, Vue, or Angular
- News sites that load articles via AJAX
- E-commerce sites that load product details dynamically
- Social media feeds that populate after page load

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

3. **Try different wait times** - some sites may need longer:
   ```bash
   # For very slow sites, try waiting up to 10 seconds
   url-to-md https://slow-site.com --wait 10.0
   ```

### Common Issues

#### "Chrome/Chromium not found"
```bash
# Install Chrome (see Installation section above)
# Or if Chrome is installed but not in PATH:
export CHROME_EXECUTABLE_PATH="/path/to/chrome"
```

#### "Permission denied" errors
```bash
# On Linux/macOS, make sure the binary is executable
chmod +x /usr/local/bin/url-to-md

# Or reinstall globally
npm uninstall -g url-to-llm-friendly-md
npm install -g url-to-llm-friendly-md
```

#### Network timeout errors
```bash
# Increase wait time for slow networks
url-to-md https://example.com --wait 10.0
```

#### Out of memory errors
```bash
# For very large pages, you may need to increase Node.js memory
node --max-old-space-size=4096 $(which url-to-md) https://large-page.com
```

## Use Cases

### 🤖 AI & Machine Learning
- **Training Data**: Extract clean text from web articles for LLM training
- **RAG Systems**: Convert documentation and articles for vector databases  
- **Content Curation**: Batch process URLs for AI content pipelines

### 📚 Documentation & Research
- **Knowledge Base**: Convert external docs to consistent markdown format
- **Research**: Extract academic papers and articles for analysis
- **Archival**: Preserve web content in clean, readable format

### 🔄 Content Migration
- **CMS Migration**: Extract content from old websites
- **Documentation Sites**: Convert existing content to markdown-based docs
- **Static Site Generation**: Process dynamic content for static sites

## API Usage (Programmatic)

```javascript
const { getPageSource } = require('url-to-llm-friendly-md/src/lib/pageFetcher');
const { getProcessedMarkdown } = require('url-to-llm-friendly-md/src/lib/markdownProcessor');

async function convertUrl(url) {
  const pageSource = await getPageSource(url, { wait: 2.0 });
  const markdown = await getProcessedMarkdown(pageSource, url, {
    keepImages: false,
    keepWebpageLinks: true
  });
  return markdown;
}
```

## Development

```bash
# Clone the repository
git clone <repository-url>
cd url-to-llm-friendly-md

# Install dependencies
npm install

# Run directly
npm start https://example.com

# Run in development mode
npm run dev https://example.com

# Build binaries (optional)
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Originally inspired by [m92vyas/llm-reader](https://github.com/m92vyas/llm-reader), a Python library
- Built with [Puppeteer](https://pptr.dev/) for reliable browser automation
- Uses [Cheerio](https://cheerio.js.org/) for server-side HTML manipulation
- Powered by [Turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion

---

**Perfect for:** RAG systems, LLM training data preparation, content curation, documentation extraction, and any workflow that needs clean, structured text from web content.