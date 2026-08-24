# Architecture

Cloud Operations Center is deployed as a cloud-native operations platform running on Kubernetes.

The architecture combines:

- Application workloads
- GitOps deployments
- CI/CD automation
- Metrics, logs and distributed tracing
- Incident management
- Alerting and notifications
- PostgreSQL persistence
- Backup and disaster recovery
- Secure remote administration

---

## Architecture Diagram

<p align="center">
  <img
    src="architecture/cloud-operations-center-architecture.svg"
    alt="Cloud Operations Center architecture"
    width="100%"
  />
</p>

The editable draw.io source is available here:

[Open the draw.io source](architecture/cloud-operations-center-architecture.drawio)

---

## Production Architecture

```text
                         GitHub
                            │
                            ▼
                    GitHub Actions
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       Backend Image                 Frontend Image
             │                             │
             └──────────► GHCR ◄───────────┘
                            │
                            ▼
                    GitOps Manifests
                            │
                            ▼
                         Argo CD
                            │
                            ▼
                     Kubernetes / k3s
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      Frontend          Backend API       PostgreSQL
      React/Vite         FastAPI          PostgreSQL 16
          │                 │
          └────────┬────────┘
                   │
                   ▼
             Observability
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
 Prometheus       Loki         Tempo
   Metrics        Logs         Traces
       │           │            │
       └───────────┼────────────┘
                   ▼
                 Grafana

Prometheus ─────► Alertmanager ─────► n8n / Telegram

PostgreSQL ─────► Backup CronJob ─────► Cloudflare R2
```

---

## Kubernetes

The platform runs on Kubernetes using k3s.

Application workloads are deployed primarily in the `cloud-ops` namespace.

The main workloads are:

- Frontend
- Backend API
- PostgreSQL
- Service Checker
- Database migration jobs
- PostgreSQL backup jobs

Monitoring and observability workloads run primarily in the `monitoring` namespace.

---

## Frontend

The frontend is built with React and Vite.

It provides the user interface for:

- System overview
- Service monitoring
- Incident management
- Service availability
- Platform health
- Operational information

The frontend is deployed as a Kubernetes `Deployment`.

---

## Backend API

The backend is implemented with FastAPI and Python.

It is responsible for:

- Business logic
- Authentication
- Service management
- Incident management
- Automated service checks
- Health endpoints
- PostgreSQL access
- Metrics integration
- Distributed tracing integration

The API is deployed as a Kubernetes `Deployment`.

---

## PostgreSQL

PostgreSQL 16 provides persistent storage for the platform.

It stores:

- Users
- Services
- Service checks
- Incidents
- Alembic migration state

Persistent storage is provided through Kubernetes `PersistentVolumeClaims`.

Database schema migrations are managed with Alembic.

---

## Service Checker

A Kubernetes `CronJob` periodically checks the availability of configured services.

The Service Checker records service availability data and can automatically:

- Detect service failures
- Create incidents
- Record check history
- Detect service recovery
- Resolve incidents

---

## Observability

Cloud Operations Center includes a complete observability stack for metrics, logs and distributed traces.

### Prometheus

Prometheus collects:

- Backend metrics
- HTTP metrics
- Application metrics
- Kubernetes workload metrics
- Platform health information

Prometheus also evaluates alerting rules.

### Grafana

Grafana provides visualization for:

- Metrics
- Logs
- Distributed traces
- Kubernetes workloads
- Application performance
- Platform health
- Alerts

### Loki

Loki centralizes application and infrastructure logs.

Logs can be explored and correlated with metrics and traces through Grafana.

### Tempo

Tempo stores distributed traces generated through OpenTelemetry.

### OpenTelemetry

The FastAPI backend is instrumented with OpenTelemetry.

Distributed traces are exported to Tempo.

Trace identifiers can also be included in application logs, allowing correlation between:

```text
Request
   │
   ▼
Trace ID
   ├──► Application Log
   └──► Tempo Trace
```

### Grafana Alloy

Grafana Alloy collects and forwards telemetry data across the observability stack.

### kube-state-metrics

`kube-state-metrics` exposes Kubernetes workload and object state to Prometheus.

### Alertmanager

Alertmanager processes alerts generated by Prometheus.

Operational alerts can be forwarded to automation workflows and external notification systems.

---

## Incident Automation

Operational events can be processed through n8n.

```text
Cloud Operations Center
        │
        ▼
       n8n
        │
        ▼
Incident State Detection
        │
        ├── Open
        ├── Investigating
        └── Resolved
        │
        ▼
     Telegram
```

Technical monitoring alerts follow a separate path:

```text
Prometheus
    │
    ▼
Alertmanager
    │
    ▼
   n8n
    │
    ▼
Telegram
```

This separates infrastructure alerting from application incident lifecycle automation.

---

## CI/CD

GitHub Actions provides the CI/CD pipeline.

Pull requests execute validation jobs without deploying production images.

Validation includes:

- Backend tests with `pytest`
- Python validation
- Frontend linting
- Frontend production build

After changes are merged into `main`, the pipeline:

1. Builds backend and frontend Docker images.
2. Pushes them to GitHub Container Registry.
3. Tags images using immutable commit-based tags.
4. Updates the Kubernetes manifests.
5. Creates the GitOps deployment commit.

Example image tags:

```text
cloud-operations-backend:sha-<commit>
cloud-operations-frontend:sha-<commit>
```

---

## GitOps

Argo CD manages Kubernetes deployments using GitOps principles.

The deployment flow is:

```text
GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Build & Push Images
   │
   ▼
GitHub Container Registry
   │
   ▼
Update Kubernetes Manifests
   │
   ▼
Git Repository
   │
   ▼
Argo CD
   │
   ▼
Kubernetes
```

Git acts as the source of truth for the platform.

Argo CD continuously reconciles the desired state stored in Git with the running Kubernetes cluster.

---

## Networking and TLS

External traffic reaches the platform through NGINX Ingress.

HTTPS certificates are issued and managed automatically with cert-manager.

Production endpoints include:

- `https://app.cloudopscenter.es`
- `https://api.cloudopscenter.es`
- `https://grafana.cloudopscenter.es`
- `https://prometheus.cloudopscenter.es`
- `https://argocd.cloudopscenter.es`

---

## Platform Health

The backend exposes:

```text
/health
```

for basic health checking.

A more detailed endpoint is also available:

```text
/health/detailed
```

It verifies the operational state of:

- PostgreSQL
- Prometheus
- Tempo

It also exposes deployment metadata such as:

- Application version
- Build SHA
- Environment
- Timestamp

The frontend **System** page displays this information.

---

## Backup and Disaster Recovery

PostgreSQL backups are executed automatically using a Kubernetes `CronJob`.

The backup flow is:

```text
PostgreSQL
    │
    ▼
  pg_dump
    │
    ▼
Backup CronJob
    │
    ├──► Local Backup Storage
    │
    └──► Cloudflare R2
```

The backup process:

1. Creates a PostgreSQL custom-format dump.
2. Validates the generated backup.
3. Stores a local copy.
4. Uploads the backup to Cloudflare R2.
5. Verifies the remote object.

The disaster recovery procedure has been tested end-to-end.

```text
Cloudflare R2
      │
      ▼
Download Backup
      │
      ▼
Isolated PostgreSQL
      │
      ▼
Restore
      │
      ▼
Validate Database
```

The recovery test is performed without modifying the production database.

---

## Secure Administration

NetBird is used for secure private administrative access to selected platform services and infrastructure.

This provides an additional private networking layer for management operations.

---

## Main Technologies

| Area | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI / Python |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Containers | Docker |
| Orchestration | Kubernetes / k3s |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |
| Container Registry | GitHub Container Registry |
| Metrics | Prometheus |
| Dashboards | Grafana |
| Logs | Loki |
| Tracing | OpenTelemetry + Tempo |
| Telemetry Collection | Grafana Alloy |
| Kubernetes Metrics | kube-state-metrics |
| Alerts | Alertmanager |
| Automation | n8n |
| Notifications | Telegram |
| TLS | cert-manager |
| Ingress | NGINX Ingress |
| Backups | PostgreSQL + Cloudflare R2 |
| Private Access | NetBird |
