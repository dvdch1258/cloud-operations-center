# Alerting responsibilities

## Flujo definitivo

```text
Prometheus → Alertmanager → n8n → Telegram
                      |
                      └── agrupación, deduplicación e inhibiciones

Grafana → dashboards, métricas, logs y trazas para investigación
```

## Responsabilidades

### Prometheus

Prometheus recopila las métricas y evalúa las reglas de alerta.

Es el único componente responsable de decidir cuándo una condición técnica pasa a `firing` o vuelve a `resolved`.

### Alertmanager

Alertmanager recibe las alertas de Prometheus y gestiona:

- Agrupación por alerta, namespace y severidad.
- Deduplicación.
- Intervalos de notificación y repetición.
- Notificaciones de resolución.
- Inhibición de alertas secundarias.
- Envío del webhook a n8n.

`BackendUnavailable` inhibe `BackendTargetDown` cuando ambas representan el mismo incidente.

### n8n

n8n no evalúa métricas ni sustituye a Prometheus.

El workflow `Cloud Ops - Alertas técnicas`:

- Recibe el webhook de Alertmanager.
- Valida el payload.
- Formatea el mensaje.
- Diferencia alertas activas y resueltas.
- Añade protección frente a reintentos idénticos.
- Envía la notificación a Telegram.

El workflow `Cloud Ops - Notificaciones de incidentes` permanece separado y gestiona los incidentes registrados por la aplicación.

### Grafana

Grafana se utiliza exclusivamente para investigar:

- Métricas mediante Prometheus.
- Logs mediante Loki.
- Trazas mediante Tempo.
- Estado general mediante dashboards.

Grafana no envía notificaciones a Telegram y no mantiene reglas duplicadas de Prometheus.

## Catálogo inicial de alertas

| Alerta | Severidad | Objetivo |
|---|---|---|
| `PodPendingTooLong` | warning | Detectar pods bloqueados en Pending |
| `ContainerRestarting` | warning | Detectar 3 o más reinicios en 15 minutos |
| `BackendUnavailable` | critical | Detectar ausencia de réplicas disponibles |
| `PostgreSQLUnavailable` | critical | Detectar ausencia de PostgreSQL |
| `BackendHPAAtMaximum` | warning | Detectar saturación prolongada del HPA |
| `BackendTargetDown` | critical | Detectar pérdida del target de Prometheus |
| `KubeStateMetricsDown` | warning | Detectar pérdida de métricas de Kubernetes |
| `BackendHighErrorRate` | critical | Detectar una tasa elevada de errores 5xx |
| `BackendHighLatency` | warning | Detectar p95 superior a 750 ms con tráfico real |
| `TooManyOpenIncidents` | warning | Detectar acumulación de incidencias abiertas |

## Exclusiones de latencia

La alerta `BackendHighLatency` no evalúa endpoints internos:

- `/health`
- `/metrics`
- `/services/check-all`
- handlers sin identificar

Esto evita alertas causadas por comprobaciones internas y scraping.
