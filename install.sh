#!/usr/bin/env bash
set -e

# Check for python venv support
if ! python -m venv -h >/dev/null 2>&1; then
  echo "Python virtual environment support not found." >&2
  echo "Please install the python3-venv package and rerun this script." >&2
  exit 1
fi

# Create virtual environment if it does not exist
if [ ! -d "venv" ]; then
  python -m venv venv
fi

# shellcheck source=/dev/null
. venv/bin/activate
python -m pip install --upgrade pip

if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

printf '\nSetup complete. Activate the virtual environment with: source venv/bin/activate\n'


