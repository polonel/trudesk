FROM node:argon

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY package.json /usr/src/trudesk
COPY config.json /usr/src/trudesk
RUN npm install -g requirejs grunt grunt-cli
RUN npm install

COPY . /usr/src/trudesk

RUN grunt build

EXPOSE 8118

CMD [ "npm", "start" ]