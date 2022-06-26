# Kubernetes deploy

## Deploy the manifests

### Create namespace
<code> kubectl create ns trudesk </code>

### Apply manifests
<code> kubectl apply -f .  </code>

**You need to define your own ingress or expose the service to access trudesk!!!**


Wait some seconds until the deployment is completed.

## Configure Elastic
Log into Trudesk and go to Settings > Elasticsearch and define the endpoint of the elastic service

- Server: http://elasticsearch.trudesk.svc.cluster.local
- Port: 9200
