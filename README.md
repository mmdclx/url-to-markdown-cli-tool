# url-to-llm-friendly-markdown
Use this cli to quickly grab a url and output an LLM friendly markdown file. Utilises m92vyas/llm-reader lib.

## Setup
Run `./install.sh` to create a `venv` directory and install dependencies.

Activate the environment with:

```bash
source venv/bin/activate
```


## Build
Run `./build.sh` to create a standalone binary using PyInstaller. The script reuses the virtual environment created by `install.sh` or creates one if needed.

The resulting executable is placed in the `build/` directory. Execute it with:

```bash
./build/url-to-llm-friendly-md
```
