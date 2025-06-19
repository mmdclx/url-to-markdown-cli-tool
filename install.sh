#!/bin/bash
set -euo pipefail

python -m pip install --upgrade pip
pip install git+https://github.com/m92vyas/llm-reader
pip install .
