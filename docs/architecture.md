# Architecture

## High Level Architecture

```text
Frontend
    │
    ▼
Backend API
    │
    ▼
PostgreSQL
```

---

## Future Architecture

```text
                   GitHub Actions
                           │
                           ▼
                     Docker Images
                           │
                           ▼
                        ArgoCD
                           │
                           ▼
                     Kubernetes
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼

Frontend           Backend API           PostgreSQL

      │                    │
      └──────────┬─────────┘
                 ▼

          OpenTelemetry

                 ▼

              Tempo

                 ▼

              Grafana

Prometheus ──────┤

Loki ────────────┘
```

## Components

### Frontend

Interfaz web para visualizar servicios e incidencias.

### Backend API

Gestiona lógica de negocio y acceso a datos.

### PostgreSQL

Persistencia de datos.

### OpenTelemetry

Instrumentación de trazas.

### Prometheus

Recopilación de métricas.

### Loki

Almacenamiento de logs.

### Tempo

Almacenamiento de trazas.

### Grafana

Visualización unificada.
