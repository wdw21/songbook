#!/bin/bash

# Cloud function: https://console.cloud.google.com/functions/details/europe-west1/songbook-gh6?env=gen2&project=ptab-project&tab=details

gcloud functions deploy editor-github-pr-proxy \
  --allow-unauthenticated \
  --project wdw-21 \
  --region=europe-west3 --runtime nodejs16 --trigger-http --max-instances=3 --source . --memory=128Mi --gen2 \
  --entry-point=app \
  --set-secrets=GITHUB_TOKEN=projects/wdw-21/secrets/github-comments-token:latest

#  --env-vars-file=google-cloud-functions-env.txt \
#  --set-secrets=OAUTH_APP_SECRET=projects/997188391745/secrets/songbook-OAUTH_APP_SECRET:latest

projects/660500178903/secrets/github-comments-token

# See secret details: https://console.cloud.google.com/security/secret-manager/secret/songbook-OAUTH_APP_SECRET/
# Generate new secret: https://github.com/settings/applications/2019824