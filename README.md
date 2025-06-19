This repository provides a simple command line interface that wraps the
[m92vyas/llm-reader](https://github.com/m92vyas/llm-reader) library.  
Use it to fetch a webpage and output the processed, LLM-friendly markdown.

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

```bash
url-to-llm-friendly-md https://example.com -o page.md
```

Run `url-to-llm-friendly-md --help` for available options.

## Dependencies
The CLI relies on Google Chrome and the matching ChromeDriver binary. Make sure
both are installed and on your `PATH` before running.
