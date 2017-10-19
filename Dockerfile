FROM node:8-alpine

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY package.json /usr/src/trudesk
COPY . /usr/src/trudesk

RUN apk add --no-cache make gcc g++ python && \
    npm install -g yarn && \
    yarn && \
    npm run build && \
    npm prune --production && \
    apk del make gcc g++ python

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]