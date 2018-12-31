![](http://trudesk.io/TD_Black500.png)
***
## Docker Install
The below example shows running a `MongoDB` container and linking it to a trudesk container.

> *Note: In this example all container storage is located on the host. 
> In order to run trudesk in a multi-host container cluster, you will require a shared storage. (ex: NFS)*

#### Storage - Create directories on host
``` bash
$ mkdir -p /data/db
$ mkdir -p /data/configdb
$ mkdir -p /data/trudesk/plugins
$ mkdir -p /data/trudesk/uploads
```

#### MongoDB Container
The following command will deploy a `mongodb 3.6` docker container with the name `mongodb`, which we will use to link to our `trudesk` container.
``` bash
$ docker run --name mongodb \
    -v /data/db:/data/db \
    -v /data/configdb:/data/configdb \
    -d mongo:3.6
```

#### Trudesk Container
The following command will deploy a `trudesk 1.0` docker container. The container will expose a `NodePort` to access the container.

Get latest updated image of `1.0`
``` bash
$ docker pull polonel/trudesk:1.0
```

``` bash
$ docker run --name trudesk --link mongodb:mongodb \
    -v /data/trudesk/uploads:/usr/src/trudesk/public/uploads \
    -v /data/trudesk/plugins:/usr/src/trudesk/plugins \
    -e NODE_ENV=production \
    -e MONGODB_PORT_27017_TCP_ADDR=mongodb -e MONGODB_DATABASE_NAME=trudesk \
    -P -d polonel/trudesk:$TAG
```

#### Accessing the trudesk container
Once the containers are running, access the trudesk container via the assigned `NodePort`.
The following command will list the two running containers. Notice under the ports column 
the NodePort - __32772__. This will allow access to the trudesk container via `http://{hostip}:32772`

``` bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                     NAMES
5f75716aa8cc        polonel/trudesk:1   "/bin/bash /usr/src/…"   1 minute ago        Up 1 minute         0.0.0.0:32772->8118/tcp   trudesk
5b4f77cbf1a3        mongo:3.6           "docker-entrypoint.s…"   32 minutes ago      Up 32 minutes       27017/tcp                 mongodb
```