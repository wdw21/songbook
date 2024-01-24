#!/bin/bash

docker build -f ./docker/Dockerfile -t europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest .
# docker push europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker:latest
