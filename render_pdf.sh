#!/usr/bin/env bash

set -o errexit
set -o pipefail

__dir="$(
  cd "$(dirname "$0")" 2>&1 >/dev/null
  pwd -P
)"
__script="$(basename "$0")"

display_usage() {
  echo "Renders a PDF containing a single song, or a compiled songbook."
  echo "Usage: ${__script} <single|songbook> <a4|a5> TITLE XML_SONG_FILES..."
}

if [[ $# -lt 4 ]]; then
  display_usage
  exit 1
fi

format=$1
papersize=$2
title=$3

tex_dir=${__dir}/build/songs_tex/
tex_file=${__dir}/build/songs_tex/output.tex
mkdir -p ${tex_dir}

echo ${tex_file}
python3 ${__dir}/src/latex/songs2tex.py "${format}" "${papersize}" "${title}" ${@:4} >${tex_file}

# Run pdflatex three times to recalculate longtables and toc
TEXINPUTS=.:${__dir}/src/latex: pdflatex -output-directory "${tex_dir}" "${tex_file}"
TEXINPUTS=.:${__dir}/src/latex: pdflatex -output-directory "${tex_dir}" "${tex_file}"
TEXINPUTS=.:${__dir}/src/latex: pdflatex -output-directory "${tex_dir}" "${tex_file}"
