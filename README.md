# Cloud Operations Center

Cloud Operations Center es una plataforma cloud-native para monitorización de servicios, gestión de incidencias y observabilidad.

## Objetivo

Construir una plataforma similar a las herramientas utilizadas por equipos de operaciones, cloud y SRE.

## Funcionalidades

- Gestión de servicios
- Gestión de incidencias
- Dashboard operativo
- Monitorización
- Observabilidad distribuida

## Stack tecnológico

### Backend

- FastAPI
- PostgreSQL

### Frontend

- React

### Infraestructura

- Docker
- Kubernetes
- ArgoCD

### Observabilidad

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo


El backend está instrumentado con OpenTelemetry y exporta trazas a Grafana Tempo mediante OTLP.

### Flujo de trazas

```text
FastAPI
  ↓
OpenTelemetry
  ↓
Tempo
  ↓
Grafana

## Métricas con Prometheus

El backend expone métricas en:

```text
http://localhost:8000/metrics
