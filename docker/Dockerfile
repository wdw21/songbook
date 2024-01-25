FROM ubuntu
WORKDIR /app
ENV TZ=Europe/Warsaw
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get -yq install texlive python3-lxml texlive-latex-extra texlive-lang-polish pip pkg-config libicu-dev
RUN apt-get -yq install epubcheck
COPY ./requirements.txt /tmp/requirements.txt
RUN pip3 install -r /tmp/requirements.txt
CMD ["/bin/bash"]
