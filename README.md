# url-to-llm-friendly-markdown

This repository provides a simple command line interface that wraps the
[m92vyas/llm-reader](https://github.com/m92vyas/llm-reader) library.  
Use it to fetch a webpage and output the processed, LLM-friendly markdown.

## Installation

Run the bundled script to install this project and its dependency
[`llm-reader`](https://github.com/m92vyas/llm-reader):

```bash
./install.sh
```

This will install a `url-to-llm` command on your system.

The CLI relies on Google Chrome and the matching ChromeDriver binary. Make sure
both are installed and on your `PATH` before running.

## Usage

```bash
url-to-llm https://example.com -o page.md
```

Run `url-to-llm --help` for available options.
