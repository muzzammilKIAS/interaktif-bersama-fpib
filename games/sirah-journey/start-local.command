#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 serve.py
elif command -v python >/dev/null 2>&1 && python -c 'import sys; assert sys.version_info.major == 3' >/dev/null 2>&1; then
  python serve.py
else
  echo 'Python 3 diperlukan. Pasang dari https://www.python.org/downloads/'
fi
read -r -p 'Tekan Enter untuk tutup... '
