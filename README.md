# url-to-llm-friendly-md

A CLI tool that converts web pages into clean, LLM-friendly markdown format. Originally inspired by [m92vyas/llm-reader](https://github.com/m92vyas/llm-reader), this tool fetches web content and strips away noise like ads, navigation elements, and unnecessary formatting, leaving you with properly formatted markdown that's perfect for feeding into large language models.

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

### Available Options

Run `url-to-llm-friendly-md --help` for all available options:

```bash
# Basic output to file
url-to-llm-friendly-md https://example.com -o page.md

# Remove all images from output
url-to-llm-friendly-md https://example.com --no-images

# Remove specific image types
url-to-llm-friendly-md https://example.com --no-gif-images --no-svg-images

# Remove webpage links
url-to-llm-friendly-md https://example.com --no-links

# Remove specific HTML tags
url-to-llm-friendly-md https://example.com --remove-tags div span script

# Combine multiple options
url-to-llm-friendly-md https://example.com --no-images --no-links --remove-tags nav footer --wait 3.0 -o clean-page.md

# Run with visible browser (non-headless mode)
url-to-llm-friendly-md https://example.com --no-headless
```

## Dependencies
The CLI relies on Google Chrome and the matching ChromeDriver binary. Make sure
both are installed and on your `PATH` before running.
