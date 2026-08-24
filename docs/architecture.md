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
