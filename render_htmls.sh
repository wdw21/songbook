#!/usr/bin/env bash

set -o errexit
set -o pipefail

__dir="$(
  cd "$(dirname "$0")" 2>&1 >/dev/null
  pwd -P
)"
__script="$(basename "$0")"

display_usage() {
  echo "Renders a Zip file containing songs in html"
  echo "Usage: ${__script} "
} #funkcja która wypisuje pomoc

if [[ $# -gt 1 ]]; then
  display_usage
  exit 1
fi

cd "${__dir}/src/html/"
PYTHONPATH="${__dir}" python3 htmls_generator.py
PYTHONPATH="${__dir}" python3 index_generator.py
cd "${__dir}/build/"
zip -r songs_html.zip songs_html
