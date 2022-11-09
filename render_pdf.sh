#!/usr/bin/env bash

set -o errexit
set -o pipefail

__dir="$(cd "$(dirname "$0")" 2>&1 >/dev/null; pwd -P)"
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

tex_dir=${__dir}/build
tex_file=${__dir}/build/output.tex

sed "s/:title:/${title}/" ${__dir}/src/formats/${format}_${papersize}_p.tex > ${tex_file}
for song in ${@:4}; do
    python3 ${__dir}/src/song2tex.py $song >> ${tex_file}
done
cat ${__dir}/src/formats/${format}_${papersize}_s.tex >> ${tex_file}

# Run pdflatex twice to recalculate longtables
TEXINPUTS=.:${__dir}/src/latex: pdflatex -output-directory ${tex_dir} ${tex_file}
TEXINPUTS=.:${__dir}/src/latex: pdflatex -output-directory ${tex_dir} ${tex_file}
