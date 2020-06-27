# base image
FROM ubuntu:18.04

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add requirements (to leverage Docker cache)
ADD ./requirements.txt /usr/src/app/requirements.txt

# install requirements
RUN apt-get update && apt-get install -y \
    aufs-tools \
    automake \
    build-essential \
    curl \
    dpkg-sig \
    libcap-dev \
    libsqlite3-dev \
    python3.8 \
    python3-pip \
    locales \
    git \
 && rm -rf /var/lib/apt/lists/*

# copy project
COPY . /usr/src/app

# Set the locale
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

RUN pip3 install -r requirements.txt

# pull other project
RUN git clone https://github.com/egk696/SimpleSMTScheduler.git /usr/src/SimpleSMTScheduler

ENV FLASK_APP manage.py

CMD ["gunicorn", "manage:app"]
#comment above cmd and uncomment below to deply worker to heroku
#CMD ["python3","/usr/src/app/manage.py","run_worker"]
