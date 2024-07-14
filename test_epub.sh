#!/bin/bash

set -e -x

./render_epub.sh "${@}"
epubcheck ./build/spiewnik.epub