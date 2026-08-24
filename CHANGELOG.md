# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-08-24

### Added

- React frontend for operational monitoring
- FastAPI backend
- PostgreSQL persistence
- Alembic database migrations
- Service registration and health monitoring
- Automated service checker
- Incident lifecycle management
- Operational dashboard
- Prometheus metrics
- Grafana dashboards
- Centralized logging with Grafana Alloy and Loki
- Distributed tracing with OpenTelemetry and Tempo
- Prometheus and Alertmanager alerting
- kube-state-metrics integration for Kubernetes workload metrics
- n8n incident automation
- Telegram incident and technical alert notifications
- Kubernetes Deployments, Services, Ingress and health probes
- Horizontal Pod Autoscaling
- GitOps deployment with Argo CD
- CI/CD with GitHub Actions
- Automated backend test suite with 12 API, authentication, incident and service-checker tests
- Backend tests enforced as a CI/CD deployment gate
- Container images published to GitHub Container Registry
- Immutable SHA-based image deployments
- Application version and build metadata
- Automated PostgreSQL backups
- Persistent local backup storage
- Off-site backup replication to Cloudflare R2
- Tested PostgreSQL restore and disaster recovery workflow
- Secure remote access through NetBird
- Portfolio documentation and screenshots

### Security

- Removed sensitive PostgreSQL credentials from Git history
- Rotated exposed PostgreSQL credentials
- Added Git ignore rules for local secrets and environment files

### Release

Cloud Operations Center v1.0.0 represents the first complete and operational release of the platform.
