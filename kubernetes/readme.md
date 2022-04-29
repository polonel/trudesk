# Kubernetes deploy

## Deploy the manifests

### Create namespace
<code> kubectl create ns truedesk </code>

### Apply manifests
<code> kubectl apply -f . -n truedesk </code>

**You need to define your own ingress or expose the service!!!**


Wait some seconds until the deployment is completed.

## Configure Elastic
Log into TrueDesk and go to Settings > Elasticsearch and define de enpoint of the elastic service

- Server: http://elasticsearch.truedesk.svc.cluster.local
- Port: 9200 


## To Do

- Truedesk reinstalls every time the pod dies 
- 
