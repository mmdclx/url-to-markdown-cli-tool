#!/usr/bin/env bash
set -e

# Ensure python venv support exists
if ! python -m venv -h >/dev/null 2>&1; then
  echo "Python virtual environment support not found." >&2
  echo "Please install the python3-venv package and rerun this script." >&2
  exit 1
fi

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  python -m venv venv
fi

# shellcheck source=/dev/null
. venv/bin/activate
python -m pip install --upgrade pip
pip install --upgrade pyinstaller

# Build the binary
pyinstaller --onefile src/cli.py -n url-to-llm-friendly-md

# Move binary to build directory
mkdir -p build
mv -f dist/url-to-llm-friendly-md build/

printf '\nBinary available at build/url-to-llm-friendly-md\n'
