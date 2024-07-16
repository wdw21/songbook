#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -x

__dir="$(
  cd "$(dirname "$0")" 2>&1 >/dev/null
  pwd -P
)"
__script="$(basename "$0")"

display_usage() {
  echo "Renders a PDF containing a single song, or a compiled songbook."
  echo "Usage: ${__script} <single|songbook> <a4|a5> TITLE XML_SONG_FILES..."
  echo "   or: ${__script} <a4|a5> optional: songbook.yaml"

}

if [[ $# -lt 1 ]]; then
  display_usage
  exit 1
fi

tex_dir=${__dir}/build/songs_tex
tex_file=${__dir}/build/songs_tex/output.tex
mkdir -p ${tex_dir}

if [[ "${@: -1}" =~ \.yaml$ || $# -lt 4 ]]; then
  papersize=$1
  PYTHONPATH="${__dir}" python3 ${__dir}/src/latex/songbook2tex.py "${papersize}" "${@:2}" >${tex_file}
  SONGBOOK_ID=$(PYTHONPATH="${__dir}" python3 ${__dir}/src/songbook2id.py "${@:2}")
  JOB="${SONGBOOK_ID}_${papersize}"
else
  format=$1
  papersize=$2
  title=$3
  PYTHONPATH="${__dir}" python3 ${__dir}/src/latex/songs2tex.py "${format}" "${papersize}" "${title}" "${@:4}" >${tex_file}
  JOB="output"
fi

# Run pdflatex three times to recalculate longtables and toc
TEXINPUTS=.:${__dir}/src/latex: pdflatex -jobname=${JOB} -output-directory "${tex_dir}" "${tex_file}"
TEXINPUTS=.:${__dir}/src/latex: pdflatex -jobname=${JOB} -output-directory "${tex_dir}" "${tex_file}"
TEXINPUTS=.:${__dir}/src/latex: pdflatex -jobname=${JOB} -output-directory "${tex_dir}" "${tex_file}"
