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


## Logs con Loki

El backend genera logs estructurados en JSON y Promtail los envía a Loki.

### Flujo de logs

```text
FastAPI
  ↓
stdout JSON logs
  ↓
Promtail
  ↓
Loki
  ↓
Grafana


## Traffic Generator

El laboratorio incluye un generador de tráfico automático para simular uso real de la plataforma.

### Objetivo

Generar actividad continua contra la API para alimentar:

- Métricas en Prometheus
- Trazas en Tempo
- Logs en Loki

### Flujo

```text
Traffic Generator
  ↓
FastAPI Backend
  ↓
PostgreSQL
  ↓
OpenTelemetry / Prometheus / Loki
  ↓
Grafana
