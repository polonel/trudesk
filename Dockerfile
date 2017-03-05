FROM node:6.3.0-wheezy

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY package.json /usr/src/trudesk
RUN npm install

COPY . /usr/src/trudesk

RUN npm run build

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]