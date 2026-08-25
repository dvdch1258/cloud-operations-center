# ingress-nginx

Helm configuration for the ingress-nginx controller used by Cloud Operations Center.

## Version

- Helm chart: ingress-nginx/ingress-nginx
- Chart version: 4.15.1
- Controller version: 1.15.1

The chart version is pinned to make cluster recreation reproducible.

## Installation / upgrade

Add the official Helm repository:

    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update

Install or upgrade ingress-nginx:

    helm upgrade --install ingress-nginx       ingress-nginx/ingress-nginx       --namespace ingress-nginx       --create-namespace       --version 4.15.1       -f infra/ingress-nginx/values.yaml

## Real client IP preservation

The service uses:

    controller.service.externalTrafficPolicy: Local

This preserves the original client source IP before traffic reaches
ingress-nginx.

The backend separately trusts proxy headers originating from the internal
Kubernetes pod network using:

    FORWARDED_ALLOW_IPS=10.42.0.0/16

Request path:

    Client
      -> LoadBalancer
      -> ingress-nginx
      -> frontend nginx
      -> FastAPI / Uvicorn
      -> security_events.ip_address

## Validation

Check the service configuration:

    kubectl -n ingress-nginx get svc ingress-nginx-controller       -o jsonpath='externalTrafficPolicy={.spec.externalTrafficPolicy}{"\n"}'

Expected:

    externalTrafficPolicy=Local

Check the controller:

    kubectl -n ingress-nginx get pods

Check the API:

    curl -fsS https://api.cloudopscenter.es/health

Expected:

    {"status":"ok"}

## Multi-node note

The current cluster uses a single Kubernetes node.

If the cluster is expanded to multiple nodes, externalTrafficPolicy=Local
must be reviewed to ensure ingress-nginx is available on every node that can
receive external load-balancer traffic.
