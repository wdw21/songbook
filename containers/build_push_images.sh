#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

set -e -x

cd "${SCRIPT_DIR}/.."
docker build -f "${SCRIPT_DIR}/Dockerfile" -t europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest --platform linux/amd64 .
docker push europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest
