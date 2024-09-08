#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

set -e -x

cd "${SCRIPT_DIR}/.."
docker build -f "${SCRIPT_DIR}/Dockerfile" -t europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest --platform linux/amd64 .

docker image tag europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker ghcr.io/wdw21/github-latex-worker:latest

docker push europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest

# Authorization using:
#  - https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
#  - https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
#echo "{PERSONAL_ACCESS_TOKEN}" | docker login ghcr.io -u ptabor --password-stdin

docker push ghcr.io/wdw21/github-latex-worker:latest