# Data Model

## Service

Representa un servicio técnico monitorizado por la plataforma.

Ejemplos:

- VPN Producción
- API Backend
- PostgreSQL
- Grafana
- NAS

### Campos

| Campo | Tipo |
|---------|---------|
| id | integer |
| name | string |
| type | string |
| endpoint | string |
| status | string |
| created_at | datetime |
| updated_at | datetime |

### Ejemplo

```json
{
  "id": 1,
  "name": "VPN Producción",
  "type": "vpn",
  "endpoint": "10.0.0.1",
  "status": "up"
}
```

---

## Incident

Representa una incidencia asociada a un servicio.

### Campos

| Campo | Tipo |
|---------|---------|
| id | integer |
| title | string |
| description | text |
| severity | string |
| status | string |
| service_id | integer |
| created_at | datetime |
| updated_at | datetime |

### Ejemplo

```json
{
  "id": 1,
  "title": "VPN Producción caída",
  "description": "La VPN no responde",
  "severity": "high",
  "status": "open",
  "service_id": 1
}
```

---

## Relaciones

Un servicio puede tener múltiples incidencias.

```text
Service
   │
   └────── Incident
```
