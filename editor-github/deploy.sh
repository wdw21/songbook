#!/bin/bash

# Cloud function: https://console.cloud.google.com/functions/details/europe-west1/songbook-gh6?env=gen2&project=ptab-project&tab=details

gcloud functions deploy songbook-gh6 \
  --region=europe-west1 --runtime nodejs16 --trigger-http --max-instances=5 --source . --memory=128Mi --gen2 \
  --entry-point=songbook \
  --env-vars-file=google-cloud-functions-env.txt \
  --set-secrets=OAUTH_APP_SECRET=projects/997188391745/secrets/songbook-OAUTH_APP_SECRET:latest

# See secret details: https://console.cloud.google.com/security/secret-manager/secret/songbook-OAUTH_APP_SECRET/
# Generate new secret: https://github.com/settings/applications/2019824