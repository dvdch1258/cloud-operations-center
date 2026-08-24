# Architecture

Cloud Operations Center is deployed as a containerized, GitOps-managed platform
running on Kubernetes.

The platform combines application workloads, automated deployments,
observability, incident management, and disaster recovery.



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

PostgreSQL ─────► Automated Backups ─────► Cloudflare R2


Kubernetes

The application runs on Kubernetes using k3s.

Application workloads are deployed in the cloud-ops namespace.

The main workloads are:

Frontend
Backend API
PostgreSQL
Service Checker
Database migration jobs

Monitoring workloads run primarily in the monitoring namespace.

Frontend

The frontend is built with React and Vite.

It provides the user interface for:

System overview
Service monitoring
Incident management
Service availability
Platform health
Operational information

The frontend is deployed as a Kubernetes Deployment.

Backend API

The backend is implemented with FastAPI.

It is responsible for:

Business logic
Authentication
Service management
Incident management
Service checks
Health endpoints
PostgreSQL access
Metrics and tracing integration

The API is deployed as a Kubernetes Deployment.

PostgreSQL

PostgreSQL 16 provides persistent storage for the platform.

It stores:

Users
Services
Service checks
Incidents
Alembic migration state

Persistent storage is provided through a Kubernetes PersistentVolumeClaim.

Database schema migrations are handled by Alembic.

Service Checker

A Kubernetes CronJob periodically checks configured services.

The checker records availability information and can automatically create or
resolve incidents based on service state.

Observability

The platform includes a complete observability stack.

Prometheus

Collects application and Kubernetes metrics.

Grafana

Provides dashboards and visualization for metrics, logs, and traces.

Loki

Centralizes application and infrastructure logs.

Tempo

Stores distributed traces generated through OpenTelemetry.

Alloy

Collects and forwards telemetry data.

kube-state-metrics

Exposes Kubernetes object and workload metrics to Prometheus.

Alertmanager

Processes Prometheus alerts and forwards operational notifications.

OpenTelemetry

The backend is instrumented with OpenTelemetry.

Distributed traces are exported to Tempo and can be correlated with
application metrics and logs through Grafana.

Incident Automation

Operational alerts can be forwarded through Alertmanager to n8n.

n8n handles automation workflows and Telegram notifications for relevant
incidents and infrastructure events.

CI/CD

GitHub Actions provides the CI/CD pipeline.

For each relevant change, the pipeline performs:

Backend validation and pytest tests.
Frontend linting and production build.
Docker image builds.
Image publication to GitHub Container Registry.
GitOps manifest updates using immutable commit-based image tags.

Pull requests execute validation jobs without deploying production images.

GitOps

Argo CD manages Kubernetes deployments using GitOps.

The deployment flow is:

GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Update Kubernetes manifests
   │
   ▼
Git repository
   │
   ▼
Argo CD
   │
   ▼
Kubernetes

Argo CD continuously reconciles the desired state stored in Git with the
running Kubernetes cluster.

Networking and TLS

External traffic reaches the platform through NGINX Ingress.

HTTPS certificates are automatically managed using cert-manager.

Production endpoints include:

https://app.cloudopscenter.es
https://api.cloudopscenter.es
https://grafana.cloudopscenter.es
https://prometheus.cloudopscenter.es
https://argocd.cloudopscenter.es
Platform Health

The backend exposes a detailed health endpoint:

/api/health/detailed

It verifies the state of:

PostgreSQL
Prometheus
Tempo

The frontend System page displays this operational state.

Backup and Disaster Recovery

PostgreSQL backups are executed automatically using a Kubernetes CronJob.

The backup process:

Creates a PostgreSQL custom-format dump.
Validates the dump.
Stores a local backup.
Uploads the backup to Cloudflare R2.
Verifies the remote object.

The disaster recovery procedure has been tested by restoring an R2 backup
into an isolated PostgreSQL instance and validating the restored data.

Secure Administration

NetBird is used for secure private administrative access to selected platform
services and infrastructure.

Main Technologies
Area	Technology
Frontend	React + Vite
Backend	FastAPI / Python
Database	PostgreSQL 16
Containers	Docker
Orchestration	Kubernetes / k3s
GitOps	Argo CD
CI/CD	GitHub Actions
Metrics	Prometheus
Dashboards	Grafana
Logs	Loki
Tracing	OpenTelemetry + Tempo
Telemetry collection	Alloy
Alerts	Alertmanager
Automation	n8n
TLS	cert-manager
Ingress	NGINX Ingress
Backups	PostgreSQL + Cloudflare R2
Private access	NetBird

