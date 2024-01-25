#!/bin/bash

docker build -f ./docker/Dockerfile -t europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest --platform linux/amd64 .
# docker push europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest
