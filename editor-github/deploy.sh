#!/bin/bash

# Cloud function: https://console.cloud.google.com/functions/details/europe-west1/songbook-ghe?env=gen2&project=wdw-21

gcloud functions deploy songbook-ghe \
  --project=wdw-21 \
  --allow-unauthenticated \
  --region=europe-west1 --runtime nodejs16 --trigger-http --max-instances=5 --source . --memory=128Mi --gen2 \
  --entry-point=songbook \
  --env-vars-file=google-cloud-functions-env.txt \
  --set-secrets=OAUTH_APP_SECRET=projects/wdw-21/secrets/github-editor-app-oauth:latest

# See secret details: https://console.cloud.google.com/security/secret-manager/secret/github-editor-app-oauth/versions?project=wdw-21
# Generate new secret: https://github.com/settings/applications/2019824