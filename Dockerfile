FROM golang:1.10.0-alpine AS gcsfuse
RUN apk add --no-cache git
ENV GOPATH /go
RUN go get -u github.com/googlecloudplatform/gcsfuse@0.30.0

FROM node:10.10-alpine AS builder

RUN mkdir -p /usr/src/trudesk
WORKDIR /usr/src/trudesk

COPY . /usr/src/trudesk

RUN apk add --no-cache --update bash make gcc g++ python
RUN npm install -g yarn
RUN yarn install --production=true
RUN npm rebuild bcrypt node-sass --build-from-source
RUN cp -R node_modules prod_node_modules
RUN yarn install --production=false
RUN yarn build
RUN rm -rf node_modules && mv prod_node_modules node_modules

FROM node:10.10-alpine
WORKDIR /usr/src/trudesk
RUN apk add --no-cache ca-certificates bash mongodb-tools fuse && rm -rf /tmp/*
COPY --from=builder /usr/src/trudesk .
COPY --from=gcsfuse /go/bin/gcsfuse /usr/local/bin

EXPOSE 8118

CMD [ "/bin/bash", "/usr/src/trudesk/startup.sh" ]
