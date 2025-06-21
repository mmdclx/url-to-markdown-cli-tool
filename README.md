# url-to-llm-friendly-md

A CLI tool that converts web pages into clean, LLM-friendly markdown format. It fetches web content and strips away noise like ads, navigation elements, and unnecessary formatting, leaving you with properly formatted markdown that's perfect for feeding into large language models.

**Key features:**
- Convert any webpage to properly formatted markdown with headers, links, and structure
- Remove images, links, or specific HTML tags as needed
- Configurable wait times for dynamic content
- Headless or visible browser modes
- Standalone binary with no runtime dependencies
- Clean output optimized for LLM parsing and understanding

## Setup
Run `./install.sh` to create a `venv` directory and install dependencies.

Activate the environment with:

```bash
source venv/bin/activate
```

## Build
Run `./build.sh` to create the `build/url-to-llm-friendly-md` binary.

You may copy this binary anywhere you like or run it directly from the `build/` directory.

### Binary Size Optimization
The binary is approximately 22MB due to bundled dependencies (Selenium, Chrome automation, HTML parsing libraries). For smaller binaries on Linux/Windows systems, install UPX:

```bash
# Linux/Windows (UPX compression works)
brew install upx  # or apt-get install upx on Ubuntu
./build.sh  # Will automatically compress if UPX is available

# macOS (UPX compression currently unsupported)
./build.sh  # Build succeeds, UPX compression is skipped
```

## Usage

Basic usage:
```bash
url-to-llm-friendly-md https://example.com -o page.md
```

### Usage Examples

#### Basic Conversion
```bash
# Convert a webpage to markdown file
url-to-llm-friendly-md https://example.com -o example.md

# Output to console
url-to-llm-friendly-md https://news.ycombinator.com
```

#### Content Filtering
```bash
# Remove all images
url-to-llm-friendly-md https://blog.example.com --no-images -o clean-blog.md

# Remove specific image types
url-to-llm-friendly-md https://site.com --no-gif-images --no-svg-images

# Remove navigation and footer elements
url-to-llm-friendly-md https://site.com --remove-tags nav footer aside
```

#### Advanced Options
```bash
# Dynamic content support - wait for JavaScript to load content
# Useful for Single Page Applications (SPAs) that load content dynamically
url-to-llm-friendly-md https://spa-app.com --wait 5.0

# Debug with visible browser to see content loading
# Helpful when content isn't fully extracted
url-to-llm-friendly-md https://dynamic-site.com --no-headless --wait 3.0

# Maximum cleanup for LLM processing
url-to-llm-friendly-md https://article.com \
  --no-images \
  --no-links \
  --remove-tags nav footer aside script style \
  --wait 3.0 \
  -o clean-article.md
```

#### Pipeline Integration
```bash
# Batch processing with error handling
for url in $(cat urls.txt); do
  echo "Processing: $url"
  url-to-llm-friendly-md "$url" -o "output/$(basename $url).md" || echo "Failed: $url"
done

# CI/CD documentation update
url-to-llm-friendly-md https://docs.internal.com/api \
  --no-images \
  --remove-tags nav sidebar \
  -o docs/api-reference.md
```

Run `url-to-llm-friendly-md --help` for all available options.

## FAQ

### Why isn't webpage content fully extracted?

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
   url-to-llm-friendly-md https://spa-app.com --wait 5.0
   ```

2. **Debug with visible browser** to see what's happening:
   ```bash
   # Watch the page load in a visible browser window
   url-to-llm-friendly-md https://dynamic-site.com --no-headless --wait 3.0
   ```
   This opens a visible Chrome window so you can see if content is still loading or if there are other issues.

3. **Try different wait times** - some sites may need longer:
   ```bash
   # For very slow sites, try waiting up to 10 seconds
   url-to-llm-friendly-md https://slow-site.com --wait 10.0
   ```

If content still isn't extracted after trying these approaches, the website may have anti-bot protection or require user interaction to load content.

## Dependencies
The CLI relies on Google Chrome and the matching ChromeDriver binary. Make sure
both are installed and on your `PATH` before running.

## Thank you to m92vyas/llm-reader
Originally inspired by [m92vyas/llm-reader](https://github.com/m92vyas/llm-reader), a python library.
