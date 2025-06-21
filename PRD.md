# Product Requirements Document: url-to-llm-friendly-md

## 1. Product Overview

### 1.1 Product Name
**url-to-llm-friendly-md** - A CLI tool for converting web pages to clean, LLM-friendly markdown

### 1.2 Product Description
A command-line interface tool that fetches web content and converts it into clean, structured markdown format specifically optimized for Large Language Model (LLM) consumption. The tool strips away webpage noise including advertisements, navigation elements, and unnecessary formatting while preserving meaningful content structure.

### 1.3 Target Users
- **AI/ML Engineers**: Processing web content for training data or LLM input
- **Data Scientists**: Extracting clean text from web sources for analysis
- **Researchers**: Converting web articles and documentation to structured format
- **Content Curators**: Batch processing web content for knowledge bases
- **Developers**: Integrating web content extraction into automation pipelines

### 1.4 Value Proposition
- **Zero Runtime Dependencies**: Standalone binary requiring no Python environment
- **LLM-Optimized Output**: Clean markdown structure perfect for language model processing
- **Flexible Content Filtering**: Granular control over what content to preserve or remove
- **Production Ready**: Robust error handling and cross-platform compatibility
- **Developer Friendly**: Simple CLI interface with comprehensive configuration options

## 2. Product Goals and Success Metrics

### 2.1 Primary Goals
1. **Reliable Web Content Extraction**: Successfully process 95%+ of common web pages
2. **Clean Output Quality**: Generate markdown that preserves semantic structure while removing noise
3. **Performance**: Process typical web pages in under 10 seconds
4. **Ease of Use**: Single command execution with intuitive flag-based configuration

### 2.2 Success Metrics
- **Functionality**: Binary works across macOS, Linux, and Windows
- **Reliability**: Less than 1% failure rate on common website types
- **User Adoption**: Active usage in CI/CD pipelines and data processing workflows
- **Output Quality**: Markdown preserves hierarchical structure (headers, lists, links)

## 3. Functional Requirements

### 3.1 Core Features

#### 3.1.1 Web Page Fetching
- **URL Processing**: Accept any valid HTTP/HTTPS URL as input
- **Dynamic Content Support**: Wait for JavaScript-rendered content to load
- **Browser Automation**: Use Selenium WebDriver with Chrome for reliable rendering
- **Headless/Visible Modes**: Support both headless automation and visible browser debugging

#### 3.1.2 Content Processing
- **HTML Parsing**: Process raw HTML using BeautifulSoup with lxml parser
- **Markdown Conversion**: Convert processed HTML to clean markdown using html2text
- **Structure Preservation**: Maintain document hierarchy (headers, lists, paragraphs)
- **Link Processing**: Convert relative URLs to absolute URLs with proper markdown syntax

#### 3.1.3 Content Filtering
- **Image Management**: 
  - Remove all images (`--no-images`)
  - Selectively remove GIF images (`--no-gif-images`)
  - Selectively remove SVG images (`--no-svg-images`)
  - Preserve images as markdown links with alt text
- **Link Control**: Option to remove all webpage links (`--no-links`)
- **Tag Removal**: Remove specific HTML tags by name (`--remove-tags`)
- **Automatic Cleanup**: Remove script tags, style tags, and navigation elements

#### 3.1.4 Output Management
- **File Output**: Save to specified file path (`-o filename.md`)
- **Console Output**: Print to stdout by default
- **Clean Formatting**: Remove excessive whitespace and empty lines
- **UTF-8 Support**: Handle international characters correctly

### 3.2 CLI Interface

```bash
url-to-llm-friendly-md <URL> [OPTIONS]

Options:
  -o, --output OUTPUT        Write output to file instead of stdout
  --wait WAIT               Seconds to wait for page load (default: 1.5)
  --no-headless            Disable headless browser mode
  --no-images              Remove images from output
  --no-links               Remove webpage links from output
  --no-gif-images          Remove GIF images from output
  --no-svg-images          Remove SVG images from output
  --remove-tags TAG [TAG...] Remove specific HTML tags
  -h, --help               Show help message
```

### 3.3 Technical Architecture

#### 3.3.1 Core Modules
- **`cli.py`**: Command-line interface and argument parsing
- **`page_fetcher.py`**: Web content retrieval using Selenium
- **`markdown_processor.py`**: HTML processing and markdown conversion

#### 3.3.2 Dependencies
- **Selenium**: Browser automation
- **BeautifulSoup4**: HTML parsing
- **html2text**: HTML to markdown conversion
- **lxml**: Fast XML/HTML parser

#### 3.3.3 Build System
- **PyInstaller**: Single binary compilation
- **UPX Compression**: Optional binary size optimization (Linux/Windows)
- **Cross-platform**: Support for macOS, Linux, Windows

## 4. Non-Functional Requirements

### 4.1 Performance
- **Processing Speed**: Complete conversion within 10 seconds for typical pages
- **Memory Usage**: Maximum 512MB RAM during processing
- **Binary Size**: ~20MB standalone executable

### 4.2 Reliability
- **Error Handling**: Graceful failure with descriptive error messages
- **Chrome Dependency**: Clear requirements for Chrome and ChromeDriver installation
- **Network Resilience**: Handle timeouts and connection failures

### 4.3 Usability
- **Zero Configuration**: Work out-of-the-box with sensible defaults
- **Clear Documentation**: Comprehensive README with examples
- **Help System**: Built-in help accessible via `--help`

### 4.4 Compatibility
- **Python Independence**: No Python runtime required for end users
- **OS Support**: macOS (ARM64/x86), Linux (x86_64), Windows (x86_64)
- **Browser Support**: Chrome/Chromium with matching ChromeDriver

## 5. Implementation Plan

### 5.1 Development Phases

#### Phase 1: Foundation (✅ Completed)
- [x] **Initial CLI Structure**: Basic argument parsing and project setup
- [x] **llm-reader Integration**: Initial implementation using external dependency
- [x] **Basic Functionality**: Core URL-to-markdown conversion working
- [x] **Build System**: PyInstaller configuration for binary generation

*Commits: Initial setup through early CLI development*

#### Phase 2: Feature Enhancement (✅ Completed)
- [x] **Image Control Flags**: Added `--no-gif-images` and `--no-svg-images` options
- [x] **Tag Removal**: Implemented `--remove-tags` for selective HTML tag removal
- [x] **Build Optimization**: PyInstaller improvements and UPX compression support
- [x] **Documentation**: Enhanced README with clear feature descriptions

*Commits: `2853632`, `b1b5d37`, `8d3b82e`, `352d508`, `ffe243c`*

#### Phase 3: Custom Implementation (✅ Completed)
- [x] **Dependency Replacement**: Replaced llm-reader with custom implementation
- [x] **Core Modules**: Developed `page_fetcher.py` and `markdown_processor.py`
- [x] **Enhanced Processing**: Better control over HTML parsing and markdown generation
- [x] **Improved Output Quality**: LLM-optimized markdown with proper structure

*Commits: `f5cae3f` - "Replace llm-reader dependency with custom implementation"*

#### Phase 4: Production Readiness (✅ Completed)
- [x] **PyInstaller Fixes**: Resolved module import issues using `sys._MEIPASS`
- [x] **Build Stability**: Fixed binary packaging and module bundling
- [x] **Project Cleanup**: Added comprehensive `.gitignore` and removed build artifacts
- [x] **Documentation Updates**: Clear installation and usage instructions

*Commits: `9d919fa`, `f3b6aa1` - PyInstaller fixes and project structure improvements*

#### Phase 5: Polish and Documentation (✅ Completed)
- [x] **README Enhancement**: Professional project description and feature list
- [x] **Usage Examples**: Comprehensive CLI usage examples
- [x] **Attribution**: Proper credit to original inspiration (m92vyas/llm-reader)
- [x] **Version Control**: Clean git history and proper branch management

*Commits: `744bae0`, `f051000` - README improvements and final polish*

### 5.2 Testing Strategy
- [x] **Manual Testing**: Verified functionality with example.com and complex websites
- [x] **CLI Testing**: All command-line options tested and working
- [x] **Binary Testing**: Standalone executable verified on target platform
- [x] **Edge Cases**: Error handling for invalid URLs and missing dependencies

## 6. Future Enhancements

*TODO: This section will be expanded based on user feedback and requirements*

### 6.1 Planned Features
- Content-specific extraction (articles, documentation, etc.)
- Batch processing capabilities for multiple URLs
- Configuration file support for complex setups
- Additional output formats (JSON, plain text)
- Performance optimizations for large-scale processing

### 6.2 Integration Opportunities
- GitHub Actions integration for documentation workflows
- Docker containerization for CI/CD pipelines
- API wrapper for programmatic access
- Plugin system for custom content processors

## 7. Risks and Mitigation

### 7.1 Technical Risks

#### 7.1.1 Chrome/ChromeDriver Dependency
**Risk**: Users may not have Chrome or matching ChromeDriver installed
**Impact**: High - Tool becomes unusable
**Mitigation**: 
- Clear documentation of requirements
- Error messages guide users to installation instructions
- Consider bundling ChromeDriver in future versions

#### 7.1.2 Website Compatibility
**Risk**: Some websites may block automated browsers or use complex anti-bot measures
**Impact**: Medium - Limited website coverage
**Mitigation**:
- User-agent rotation capabilities
- Configurable wait times for dynamic content
- Visible browser mode for debugging difficult sites

#### 7.1.3 PyInstaller Platform Issues
**Risk**: Binary may not work across all target platforms or Python versions
**Impact**: Medium - Reduced user base
**Mitigation**:
- Comprehensive testing across platforms
- Clear system requirements documentation
- Source code availability as fallback

### 7.2 Operational Risks

#### 7.2.1 Memory Usage with Large Pages
**Risk**: Processing very large web pages could cause memory issues
**Impact**: Low - Affects edge cases
**Mitigation**:
- Stream processing for large content
- Configurable memory limits
- Clear documentation of limitations

#### 7.2.2 Network Timeouts
**Risk**: Slow or unreliable networks may cause failures
**Impact**: Medium - User experience degradation
**Mitigation**:
- Configurable timeout values
- Retry mechanisms
- Clear error messages for network issues

### 7.3 Security Risks

#### 7.3.1 Malicious Website Content
**Risk**: Processing malicious websites could expose security vulnerabilities
**Impact**: Medium - Potential security exposure
**Mitigation**:
- Sandboxed browser execution
- Content sanitization in processing pipeline
- Warning documentation about processing untrusted content

#### 7.3.2 Dependency Vulnerabilities
**Risk**: Security issues in Selenium, BeautifulSoup, or other dependencies
**Impact**: Medium - Security exposure
**Mitigation**:
- Regular dependency updates
- Security scanning in CI/CD pipeline
- Pinned dependency versions for stability

## 8. Dependencies and Assumptions

### 8.1 System Dependencies
- **Chrome Browser**: Required for web rendering
- **ChromeDriver**: Must match Chrome version
- **Operating System**: macOS 10.14+, Ubuntu 18.04+, Windows 10+

### 8.2 Development Dependencies
- **Python 3.8+**: For development and building
- **PyInstaller**: For binary compilation
- **Git**: For version control

### 8.3 Assumptions
- Users have administrative privileges to install Chrome/ChromeDriver
- Target websites are publicly accessible (no authentication required)
- Network connectivity is available during execution
- Binary distribution is acceptable for target user base

## Appendix A: Example Usage

### A.1 Basic Conversion
```bash
# Convert a webpage to markdown file
url-to-llm-friendly-md https://example.com -o example.md

# Output to console
url-to-llm-friendly-md https://news.ycombinator.com
```

### A.2 Content Filtering
```bash
# Remove all images
url-to-llm-friendly-md https://blog.example.com --no-images -o clean-blog.md

# Remove specific image types
url-to-llm-friendly-md https://site.com --no-gif-images --no-svg-images

# Remove navigation and footer elements
url-to-llm-friendly-md https://site.com --remove-tags nav footer aside
```

### A.3 Advanced Options
```bash
# Visible browser with extended wait time
url-to-llm-friendly-md https://spa-app.com --no-headless --wait 5.0

# Maximum cleanup for LLM processing
url-to-llm-friendly-md https://article.com \
  --no-images \
  --no-links \
  --remove-tags nav footer aside script style \
  --wait 3.0 \
  -o clean-article.md
```

### A.4 Pipeline Integration
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