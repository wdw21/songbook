#!/bin/bash

set -e -x

# Not yet finished nor tested.
docker run -v "$PWD":/work cgr.dev/chainguard/apko build /work/latex.apko.yaml europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker2:latest /work/latex.tar
docker load -i latex.tar
docker run --rm -v "${PWD}/..:/work" -w /work -it europe-docker.pkg.dev/wdw-21/songbook/github-latex-worker2:latest-amd64 /bin/bash

# texhash
# ./render_pdf.sh songbook a4 foo songs/alpuhara.xml
#mktextfm ecssdc10
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecrm1000
#mktextfm ecssdc10
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecrm1000
#mktextfm ecssdc10
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecbx1000
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecbx1728
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecrm1728
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecrm1095
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ecrm1200
#mktexpk --mfmode / --bdpi 600 --mag 1+0/600 --dpi 600 ectt2488