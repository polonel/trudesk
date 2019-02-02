FROM node:10.10-alpine

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY . /usr/src/trudesk

RUN apk add --no-cache --update bash make gcc g++ python mongodb-tools

RUN npm install -g yarn cross-env && \
    yarn install --production --ignore-scripts --prefer-offline --force && \
    npm rebuild bcrypt node-sass --build-from-source && \
    yarn run build && \
    apk del make gcc g++ python

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]
