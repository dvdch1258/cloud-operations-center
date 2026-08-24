# Cloud Operations Center

> A cloud-native operations platform for service monitoring, incident management, observability, automation and disaster recovery.

[![CI/CD](https://github.com/dvdch1258/cloud-operations-center/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/dvdch1258/cloud-operations-center/actions/workflows/ci-cd.yml)
![Kubernetes](https://img.shields.io/badge/Kubernetes-k3s-326CE5?logo=kubernetes&logoColor=white)
![GitOps](https://img.shields.io/badge/GitOps-Argo%20CD-EF7B4D?logo=argo&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

**Cloud Operations Center** is a hands-on Cloud / DevOps / SRE portfolio project designed to reproduce the operational workflows used to run modern applications on Kubernetes.

It combines application development, GitOps, CI/CD, infrastructure automation, observability, service monitoring, incident management, notifications and disaster recovery in a single platform.

The goal is not only to deploy an application.

**The goal is to operate it.**

---

## Overview

Cloud Operations Center provides a web interface for monitoring services and managing incidents while running on Kubernetes with a complete observability and automation stack.

The platform includes:

- Service registration and health monitoring
- Automated service checks
- Incident lifecycle management
- Secure authentication
- Operational dashboard
- System health overview
- Prometheus metrics
- Centralized logs with Loki
- Distributed tracing with OpenTelemetry and Tempo
- Grafana operational dashboards
- Prometheus / Alertmanager alerting
- Incident automation with n8n
- Telegram operational notifications
- GitOps deployment with Argo CD
- CI/CD with GitHub Actions
- Container images stored in GitHub Container Registry
- Immutable commit-based deployments
- Horizontal Pod Autoscaling
- PostgreSQL persistence
- Alembic database migrations
- Automated PostgreSQL backups
- Off-site backup replication to Cloudflare R2
- Tested database restoration and disaster recovery
- Secure remote administration through NetBird

---

## Architecture

<p align="center">
  <img
    src="docs/architecture/cloud-operations-center-architecture.svg"
    alt="Cloud Operations Center architecture"
    width="100%"
  />
</p>

The platform runs on **Kubernetes / k3s** and separates application workloads from observability components.

```text
Users
  │
  ▼
HTTPS / NGINX Ingress
  │
  ├──────────────► React Frontend
  │                    │
  │                    ▼
  └──────────────► FastAPI Backend
                       │
                       ▼
                  PostgreSQL

FastAPI ──metrics──► Prometheus ──► Grafana
FastAPI ──traces───► Tempo ───────► Grafana
FastAPI ──logs─────► Alloy ──► Loki ──► Grafana

Prometheus ──► Alertmanager ──► n8n / Telegram

GitHub ──► GitHub Actions ──► GHCR
                           │
                           ▼
                    GitOps manifests
                           │
                           ▼
                        Argo CD
                           │
                           ▼
                      Kubernetes

PostgreSQL ──► Backup CronJob ──► Cloudflare R2
```

For the full technical design, see:

**[Architecture documentation](docs/architecture.md)**

The editable draw.io source is available under:

**[`docs/architecture/`](docs/architecture/)**

---

# Core Features

## Operational Dashboard

The React frontend provides a centralized view of the platform.

It displays:

- Total registered services
- Healthy services
- Unavailable services
- Open incidents
- Platform operational status
- Last refresh timestamp
- Environment information
- Application version
- Git build revision

The frontend periodically refreshes operational data from the FastAPI backend.

Operators can also manually refresh the current platform state.

---

## System Overview

The **System** page provides a platform-level operational view.

It displays:

- Application version
- Build SHA
- Environment
- Kubernetes orchestration information
- PostgreSQL health
- Prometheus health
- Tempo health
- Links to Grafana, Prometheus and Argo CD
- Main architecture components

---

## Service Monitoring

Services can be registered and monitored directly from the application.

The platform periodically evaluates registered endpoints and records their availability.

This provides the data required for:

- Current service status
- Availability history
- Service detail views
- Incident detection
- Operational dashboards
- Metrics
- Alerting

The automated service checker runs as a Kubernetes `CronJob`.

```text
Kubernetes CronJob
        │
        ▼
 Service Checker
        │
        ▼
 Cloud Operations Center API
        │
        ▼
 Registered Services
        │
        ▼
 Status + Check History
```

---

## Incident Management

Cloud Operations Center includes an incident lifecycle for operational events.

```text
Open
  │
  ▼
Investigating
  │
  ▼
Resolved
```

Incident information includes operational context such as:

- Incident status
- Related service
- Creation time
- Resolution information
- Investigation state

---

# Incident Automation — n8n & Telegram

Operational events are processed through an **n8n automation workflow**.

```text
Cloud Operations Center API
          │
          ▼
         n8n
          │
          ▼
 Detect incident changes
          │
   ┌──────┼──────────────┐
   ▼      ▼              ▼
 Open  Investigating  Resolved
          │
          ▼
       Telegram
          │
          ▼
       Operator
```

The workflow tracks previously observed incident states so notifications are triggered only when meaningful changes occur.

Typical notifications include:

- New active incidents
- Incidents under investigation
- Resolved incidents
- Relevant operational state changes

Technical monitoring is handled separately:

```text
Prometheus / Alertmanager
          │
          ▼
Technical infrastructure alerts

Cloud Operations Center
          │
          ▼
Incident lifecycle
          │
          ▼
         n8n
          │
          ▼
       Telegram
```

This separation distinguishes **technical alert detection** from **incident lifecycle automation**.

---

# Observability

The observability platform is built around the three primary telemetry signals:

- Metrics
- Logs
- Traces

---

## Metrics — Prometheus

The FastAPI backend exposes Prometheus metrics for application and HTTP telemetry.

Examples include:

- Request count
- Request rate
- HTTP status codes
- Request latency
- Application process CPU
- Application process memory
- Business-level operational metrics
- Kubernetes workload state through kube-state-metrics

```text
FastAPI
   │
   ▼
/metrics
   │
   ▼
Prometheus
   │
   ▼
Grafana
```

---

## Logs — Grafana Alloy + Loki

Application workloads write logs to stdout.

Grafana Alloy collects logs from Kubernetes and forwards them to Loki.

```text
FastAPI
   │
   ▼
Structured application logs
   │
   ▼
Kubernetes stdout
   │
   ▼
Grafana Alloy
   │
   ▼
Loki
   │
   ▼
Grafana
```

Logs can be explored alongside metrics and traces from Grafana.

---

## Distributed Tracing — OpenTelemetry + Tempo

The FastAPI backend is instrumented using OpenTelemetry.

```text
HTTP Request
    │
    ▼
FastAPI
    │
    ▼
OpenTelemetry
    │
    ▼
Tempo
    │
    ▼
Grafana
```

Trace identifiers are also included in application request logs.

```text
Request
   │
   ▼
Trace ID
   ├──► Application log
   └──► Tempo trace
```

This provides practical log and trace correlation.

---

## Grafana

Grafana provides operational dashboards for both application and infrastructure behavior.

Current visibility includes:

- Backend availability
- PostgreSQL availability
- Pending Kubernetes pods
- Active alerts
- Backend replicas
- Container restarts
- CPU usage
- Memory usage
- Prometheus targets
- Open incidents
- Total HTTP requests
- Requests per second
- Error percentage
- Average latency
- p95 latency
- Traffic per endpoint
- HTTP response status distribution
- Backend logs
- HTTP error logs

---

# Alerting

Prometheus evaluates technical alerting rules and forwards alerts to Alertmanager.

```text
Infrastructure / Application
            │
            ▼
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

At the application level:

```text
Service state / Incident state
            │
            ▼
Cloud Operations Center
            │
            ▼
           n8n
            │
            ▼
         Telegram
```

---

# Kubernetes

The platform runs on **k3s** and uses multiple namespaces to separate workloads.

## `cloud-ops`

Primary application workloads:

- React frontend
- FastAPI backend
- PostgreSQL
- Service Checker
- Database migration jobs
- PostgreSQL backup jobs

## `monitoring`

Observability workloads:

- Prometheus
- Grafana
- Loki
- Tempo
- Grafana Alloy
- Alertmanager
- kube-state-metrics

Additional infrastructure components are deployed and reconciled through Argo CD.

---

# Health Checks

Kubernetes readiness and liveness probes are configured for application workloads.

The backend exposes:

```text
/health
```

for basic Kubernetes health checking.

A detailed endpoint exposes component state and deployment metadata:

```text
/health/detailed
```

Example:

```json
{
  "status": "ok",
  "database": "up",
  "prometheus": "up",
  "tempo": "up",
  "version": "1.0.1",
  "build_sha": "<git-commit-sha>",
  "environment": "production"
}
```

The frontend **System** page presents this information visually.

---

# GitOps with Argo CD

Argo CD continuously reconciles the desired state stored in Git with the Kubernetes cluster.

The project uses multiple Argo CD Applications to separate infrastructure responsibilities.

Examples include:

- Cloud Operations Center
- Monitoring stack
- Loki
- Grafana Alloy
- cert-manager

```text
Git Repository
      │
      ▼
   Argo CD
      │
      ▼
 Kubernetes
```

Git acts as the **source of truth** for the platform.

---

# CI/CD

GitHub Actions provides the continuous integration and delivery pipeline.

## Pull Requests

Pull requests validate changes without deploying them to production.

The pipeline runs:

- Backend tests with `pytest`
- Python validation
- Frontend linting
- Frontend production build

## Main Branch

After a change is merged into `main`:

```text
Developer
   │
   ▼
git push / merge
   │
   ▼
GitHub
   │
   ▼
GitHub Actions
   │
   ├── Backend validation
   ├── Frontend validation
   ├── Docker image builds
   └── GHCR publication
   │
   ▼
GitOps manifest update
   │
   ▼
Git commit
   │
   ▼
Argo CD
   │
   ▼
Kubernetes rollout
```

Production images use immutable commit-based tags rather than `latest`.

```text
cloud-operations-backend:sha-<commit>
cloud-operations-frontend:sha-<commit>
```

This provides a direct relationship between:

```text
Git commit
   │
   ▼
Container image
   │
   ▼
Kubernetes deployment
```

---

# PostgreSQL & Persistence

PostgreSQL 16 provides persistent application storage.

Kubernetes `PersistentVolumeClaims` ensure database data survives:

- Pod recreation
- Kubernetes rollouts
- Application deployments

The database stores:

- Users
- Services
- Service checks
- Incidents
- Alembic migration state

---

# Database Migrations

Database schema evolution is managed using **Alembic**.

Migration execution is integrated with Kubernetes.

```text
Deployment
    │
    ▼
PostgreSQL readiness
    │
    ▼
Alembic migration job
    │
    ▼
Database schema
```

---

# Backup & Disaster Recovery

Database protection is implemented at multiple levels.

## Automated PostgreSQL Backups

A Kubernetes `CronJob` periodically creates PostgreSQL backups using `pg_dump`.

```text
PostgreSQL
    │
    ▼
 pg_dump
    │
    ▼
Backup CronJob
    │
    ├──► Local backup storage
    └──► Cloudflare R2
```

The backup job validates the generated dump and verifies the remote object after upload.

## Disaster Recovery Testing

The recovery process has been tested end-to-end.

```text
Cloudflare R2
      │
      ▼
Download backup
      │
      ▼
Isolated PostgreSQL
      │
      ▼
Restore
      │
      ▼
Validate database
```

This verifies the complete recovery path without modifying the production database.

---

# Reliability

The platform includes several mechanisms intended to improve operational reliability:

- Kubernetes readiness probes
- Kubernetes liveness probes
- PostgreSQL persistent storage
- Horizontal Pod Autoscaling
- Automated service health checking
- GitOps reconciliation
- Immutable container image references
- Automated PostgreSQL backups
- Off-site backup replication
- Tested disaster recovery
- Metrics monitoring
- Centralized logging
- Distributed tracing
- Alerting
- Incident automation

---

# Security

Sensitive configuration is intentionally excluded from Git.

The repository does not store:

- Real `.env` files
- Real Kubernetes Secret manifests
- Private keys
- Certificates
- Telegram credentials
- Local backup archives

Real secrets are injected independently from the Git repository.

Remote administrative access is performed through a private **NetBird** network.

External production traffic reaches the platform through **NGINX Ingress**, with HTTPS certificates managed by **cert-manager**.

Production endpoints include:

- `https://app.cloudopscenter.es`
- `https://api.cloudopscenter.es`
- `https://grafana.cloudopscenter.es`
- `https://prometheus.cloudopscenter.es`
- `https://argocd.cloudopscenter.es`

---

# Traffic Generator

The repository includes a synthetic traffic generator.

```text
Traffic Generator
       │
       ▼
FastAPI
       │
       ▼
PostgreSQL
       │
       ▼
Metrics / Logs / Traces
       │
       ▼
Grafana
```

Generated traffic feeds:

- Prometheus metrics
- Loki logs
- Tempo traces
- Grafana dashboards

This keeps the observability platform useful during demonstrations and development.

---

# Technology Stack

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

---

# Repository Structure

```text
cloud-operations-center/
├── backend/
│   ├── alembic/
│   ├── app/
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   ├── architecture.md
│   └── architecture/
├── k8s/
│   ├── argocd/
│   ├── base/
│   └── monitoring/
├── n8n/
│   └── workflows/
├── observability/
│   ├── loki/
│   ├── prometheus/
│   └── tempo/
├── scripts/
├── traffic-generator/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
└── README.md
```

---

# Documentation

Additional technical documentation is available under [`docs/`](docs/).

Key documents include:

- [Architecture](docs/architecture.md)
- Product definition
- API design
- Data model
- Alerting responsibilities
- Project backlog

---

# What This Project Demonstrates

Cloud Operations Center was designed as an end-to-end engineering project rather than an isolated web application.

It demonstrates practical experience across several engineering areas.

## Application Engineering

- REST API development
- React frontend development
- Relational database design
- Authentication
- Database migrations
- Health endpoints
- Operational user interfaces

## Containers & Kubernetes

- Docker image creation
- Kubernetes Deployments
- Kubernetes Services
- Ingress routing
- Persistent storage
- Health probes
- CronJobs
- Horizontal Pod Autoscaling

## DevOps & GitOps

- CI/CD pipelines
- Container registries
- Automated deployments
- Git-based workflows
- Immutable artifact versioning
- Argo CD
- Declarative Kubernetes configuration
- Git as infrastructure source of truth

## Observability

- Metrics
- Logs
- Distributed tracing
- Operational dashboards
- Alerting
- Trace/log correlation

## Operations & Reliability

- Service monitoring
- Incident management
- Health checking
- Incident lifecycle automation
- Telegram notifications
- Technical alerting
- Backup automation
- Off-site replication
- Disaster recovery testing

---

# Project Status

**Latest stable release:** `v1.0.1`

Core platform functionality is operational.

Current `v1.1` work focuses on:

- Product polish
- Portfolio presentation
- User experience improvements
- Documentation
- Screenshots and architecture visuals
- Demo-ready operational scenarios

---

# Author

**David C.H**

Cloud / DevOps / Systems Administration portfolio project.
