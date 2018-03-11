FROM node:8.9.4-alpine

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY package.json /usr/src/trudesk
COPY . /usr/src/trudesk

RUN apk add --no-cache --update bash

RUN apk add --no-cache make gcc g++ python -t && \
    npm install -g yarn && \
    yarn && \
    yarn install --production --ignore-scripts --prefer-offline --force && \
    npm rebuild bcrypt --build-from-source && \
    yarn run build && \
    apk del make gcc g++ python

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]
