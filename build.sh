#!/usr/bin/env bash
set -e

# Ensure python venv support exists
if ! python3 -m venv -h >/dev/null 2>&1; then
  echo "Python virtual environment support not found." >&2
  echo "Please install the python3-venv package and rerun this script." >&2
  exit 1
fi

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# shellcheck source=/dev/null
. venv/bin/activate
python3 -m pip install --upgrade pip
pip install --upgrade pyinstaller

# Build the binary
pyinstaller --onefile src/cli.py -n url-to-llm-friendly-md

# Clean up intermediate build files
rm -rf build/

# Get original binary size
ORIGINAL_SIZE=$(du -h dist/url-to-llm-friendly-md | cut -f1)

# Optional UPX compression for smaller binaries
if command -v upx >/dev/null 2>&1; then
  echo "UPX found - attempting to compress binary..."
  if upx --best dist/url-to-llm-friendly-md 2>/dev/null; then
    COMPRESSED_SIZE=$(du -h dist/url-to-llm-friendly-md | cut -f1)
    printf '\nBinary compressed: %s -> %s\n' "$ORIGINAL_SIZE" "$COMPRESSED_SIZE"
  else
    printf '\nBinary available at dist/url-to-llm-friendly-md (%s)\n' "$ORIGINAL_SIZE"
    printf 'Note: UPX compression failed (common on macOS) - binary still works\n'
  fi
else
  printf '\nBinary available at dist/url-to-llm-friendly-md (%s)\n' "$ORIGINAL_SIZE"
  printf 'Tip: Install UPX for smaller binaries on Linux/Windows: brew install upx\n'
fi
