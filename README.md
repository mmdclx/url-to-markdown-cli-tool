# url-to-markdown-cli-tool

A Node.js CLI tool that converts web pages into clean, LLM-friendly markdown format. It fetches web content using Puppeteer and strips away noise like ads, navigation elements, and unnecessary formatting, leaving you with properly formatted markdown that's perfect for feeding into large language models, RAG systems, or AI training datasets.

**Key features:**
- 🔄 Convert any webpage to properly formatted markdown with headers, links, and structure
- 🚫 Remove images, links, or specific HTML tags as needed
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

Chrome/Chromium will be automatically detected. If you don't have Chrome installed:

**macOS:**
```bash
brew install --cask google-chrome
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

### 📚 Documentation & Research
- **Knowledge Base**: Convert external docs to consistent markdown format
- **Research**: Extract academic papers and articles for analysis
- **Archival**: Preserve web content in clean, readable format

### 🔄 Content Migration
- **CMS Migration**: Extract content from old websites
- **Documentation Sites**: Convert existing content to markdown-based docs
- **Static Site Generation**: Process dynamic content for static sites

## Install from Source

To install directly from this repository:

```bash
# Clone the repository
git clone https://github.com/yourusername/url-to-markdown-cli-tool.git
cd url-to-markdown-cli-tool

# Install dependencies
npm install

# Install globally
npm install -g .

# Test the CLI
url-to-md --help
```

## Acknowledgments

- Originally inspired by [m92vyas/llm-reader](https://github.com/m92vyas/llm-reader), a Python library
- Built with [Puppeteer](https://pptr.dev/) for reliable browser automation
- Uses [Cheerio](https://cheerio.js.org/) for server-side HTML manipulation
- Powered by [Turndown](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion

---

**Perfect for:** RAG systems, LLM training data preparation, documentation extraction, and any workflow that needs clean, structured text from web content.
