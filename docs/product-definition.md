# Product Definition

## Qué es

Cloud Operations Center es una herramienta interna para equipos de sistemas, cloud y SRE.

Permite registrar servicios, comprobar su estado operativo y gestionar incidencias asociadas.

## Problema que resuelve

En una empresa pueden existir múltiples servicios técnicos como VPNs, APIs, bases de datos, dashboards, servidores internos o aplicaciones web.

El problema es que muchas veces el estado de estos servicios está repartido entre distintas herramientas.

Cloud Operations Center centraliza la información operativa básica en una sola plataforma.

## Usuario objetivo

- Técnico de sistemas
- Cloud Engineer
- DevOps Engineer
- Platform Engineer
- SRE Junior

## MVP

La primera versión tendrá:

1. Gestión de servicios
2. Gestión de incidencias
3. Dashboard operativo
4. Monitorización básica de estado

## Ejemplo de uso

Un técnico registra el servicio "VPN Producción" con su endpoint.

La plataforma comprueba periódicamente si responde.

Si el servicio falla, se registra una incidencia y se puede investigar usando métricas, logs y trazas.
