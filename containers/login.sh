#!/bin/bash

gcloud auth login piotr.tabor@gmail.com
gcloud config set project wdw-21
gcloud auth configure-docker europe-docker.pkg.dev