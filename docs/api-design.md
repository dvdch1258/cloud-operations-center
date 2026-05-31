# API Design

## Health Check

### GET /health

Comprueba que la API está operativa.

### Response

```json
{
  "status": "ok"
}
```

---

# Services

## GET /services

Obtiene todos los servicios registrados.

### Response

```json
[
  {
    "id": 1,
    "name": "VPN Producción",
    "type": "vpn",
    "status": "up"
  }
]
```

---

## GET /services/{id}

Obtiene un servicio concreto.

---

## POST /services

Crea un servicio.

### Request

```json
{
  "name": "VPN Producción",
  "type": "vpn",
  "endpoint": "10.0.0.1"
}
```

---

## PUT /services/{id}

Actualiza un servicio.

---

## DELETE /services/{id}

Elimina un servicio.

---

# Incidents

## GET /incidents

Lista todas las incidencias.

---

## GET /incidents/{id}

Obtiene una incidencia.

---

## POST /incidents

Crea una incidencia.

### Request

```json
{
  "title": "VPN caída",
  "description": "La VPN no responde",
  "severity": "high",
  "service_id": 1
}
```

---

## PUT /incidents/{id}

Actualiza una incidencia.

---

## DELETE /incidents/{id}

Elimina una incidencia.

---

# Dashboard

## GET /dashboard/summary

Devuelve métricas resumidas.

### Response

```json
{
  "services_total": 12,
  "services_up": 10,
  "services_down": 2,
  "incidents_open": 3
}
```
