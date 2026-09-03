# Incidents v2: correlación operativa

## Alcance

La ruta `/incidentes/:incidentId` reúne el servicio afectado, la línea temporal,
notas de investigación, automatizaciones y consultas de logs y trazas. La lista
de incidentes permite abrir el detalle desde el título o «Ver detalle».

La autenticación existente se mantiene. No se modifica el contrato de
`GET /internal/incidents` ni la credencial `X-N8N-API-Key` utilizada por n8n.

## Historial y automatizaciones

- Los cambios de título, descripción, severidad, servicio y estado guardan los
  valores anterior y posterior. Las actualizaciones sin cambios no añaden eventos.
- Las notas admiten hasta 4.000 caracteres y conservan autor y fecha.
- Los eventos distinguen operador, comprobador de servicios, automatización e
  histórico migrado. El usuario se referencia por ID y se conserva su nombre.
- Incidente y evento se guardan en la misma transacción. El registro de un evento
  no realiza un commit independiente.
- El comprobador vincula explícitamente la caída y recuperación con el incidente
  automático correspondiente. Las ejecuciones guardan `incident_id`, incluido el
  caso omitido por cooldown; el payload del disparador también contiene ese ID.
- Se registran inicio y final de ejecución, o su omisión. Las pruebas manuales
  no se atribuyen a incidentes reales. Tampoco se atribuyen ejecuciones antiguas
  por coincidir en servicio o fecha.
- `PATCH .../status` cambia solo el estado. Resolver fija `resolved_at`, cerrar
  conserva esa fecha y reabrir la limpia. No sobrescribe una descripción editada
  por otro operador.
- Retirar un servicio conserva sus incidentes e historial. Eliminar un incidente
  elimina su línea temporal y deja las ejecuciones con `incident_id = NULL`.
  Esta línea temporal no es un registro de auditoría inmutable.

## Correlación directa frente a contexto

Sin filtro de servicio, Loki busca la cadena literal `incident_id=<id> ` dentro
del namespace `cloud-ops`. El espacio final evita que el incidente 12 coincida
con el 123. Los eventos nuevos emiten esta marca en el mensaje de log, ya que el
formato de logging existente no incluye los campos `extra`. Los logs pueden
incluir intentos cuyo commit finalmente falló; la línea temporal persistida es
la referencia para los cambios confirmados.

Sin filtro de servicio, la pestaña de trazas muestra los IDs OpenTelemetry
capturados en los eventos del incidente. Son referencias a solicitudes que
registraron esos eventos, no una afirmación de causa raíz. Abrir una referencia
consulta su detalle en Tempo; puede no existir allí por muestreo, indexación,
fallos de exportación o retención.

Los campos opcionales permiten ampliar a contexto del servicio:

- Loki: valor exacto de `service_name`.
- Tempo: valor exacto de `service.name` de la instrumentación.

El nombre visible del servicio monitorizado no se convierte automáticamente en
una etiqueta de observabilidad. Las consultas contextuales pueden incluir
actividad ajena al incidente y la interfaz lo indica.

La ventana de logs y búsqueda contextual de trazas comienza hasta cinco minutos
antes de la creación y termina hasta cinco minutos después de la resolución,
sin superar la hora actual. Para un incidente abierto termina en el momento de
la consulta. Se limita a los últimos siete días de esa ventana, indicando el
recorte. Las referencias directas a trazas proceden del historial completo,
no de esa ventana. Las fechas se almacenan y consultan en UTC; la interfaz las
presenta en la zona horaria del navegador.

La disponibilidad de Loki o Tempo no bloquea la consulta del incidente ni sus
notas. Los errores de estos proveedores se muestran en su pestaña. Sin datos
retenidos o instrumentación, se muestra un estado vacío, no una correlación
inventada. «Actualizar» renueva el detalle y la consulta de telemetría abierta.

## API autenticada

| Método y ruta | Uso |
| --- | --- |
| `GET /incidents/{id}/details` | Incidente, servicio, primeros 50 eventos, 25 ejecuciones y totales |
| `GET /incidents/{id}/timeline` | Historial paginado: `limit` (1–200), `offset` |
| `POST /incidents/{id}/notes` | Nota: `{"text": "..."}` |
| `PATCH /incidents/{id}/status` | Estado: `open`, `investigating`, `resolved`, `closed` |
| `GET /incidents/{id}/automations` | Ejecuciones vinculadas, `limit` (1–200), `offset` |
| `GET /incidents/{id}/logs` | Loki, `service` opcional y `limit` (1–500; defecto 100) |
| `GET /incidents/{id}/traces` | Referencias o contexto Tempo, `service` opcional y `limit` (1–100; defecto 50) |

El historial se ordena por fecha e ID descendentes. La interfaz carga páginas
adicionales y evita duplicados; para incorporar actividad nueva se usa
«Actualizar». No se introduce polling adicional.

## Migración y despliegue

La revisión `d6e4b82a190f` sucede a `c2a9f4e7b631`:

1. Añade `automation_executions.incident_id`, FK nullable con `ON DELETE SET NULL`.
2. Crea `incident_events` con índice por incidente, fecha e ID.
3. Registra únicamente creación y resolución históricas cuando constan sus fechas,
   con origen `legacy`. No reconstruye notas, actores ni estados intermedios.

Es necesario aplicar la migración antes de arrancar el nuevo backend. Mantener
el flujo de rama → PR → CI → imágenes por SHA → GitOps/Argo CD. El workflow
actual actualiza también la imagen de `k8s/base/backend/migration-job.yaml`.
Antes de fusionar, comprobar en el repositorio completo que ese Job ejecuta
`alembic upgrade head` antes del despliegue del backend: los manifiestos Kubernetes
no forman parte del ZIP de código usado para esta implementación.

No ejecutar la migración manualmente contra producción para probar esta rama.
La migración es aditiva y permite volver al código anterior conservando el
esquema ampliado. Un downgrade de esquema elimina los eventos y vínculos nuevos;
no debe formar parte de un rollback rutinario. Verificar previamente el backup
según el procedimiento existente.

## Validación

`backend/tests/test_incidents_v2.py` cubre autenticación, cambios y notas,
paginación, servicios retirados, correlación de caída/recuperación, cooldown,
fallo de webhook, pruebas manuales, rollback y consultas con tiempo absoluto.

`backend/tests/test_incident_timeline_migration.py` ejecuta la migración real en
SQLite con claves foráneas activas, verificando backfill, borrado y downgrade.
Esta prueba no sustituye la ejecución en PostgreSQL; el SQL de PostgreSQL puede
revisarse sin conexión mediante Alembic en modo `--sql`.

Validación funcional tras desplegar:

1. Abrir un incidente existente y verificar las fechas históricas.
2. Crear un incidente de prueba, investigar, añadir nota, resolver y reabrir.
3. Confirmar que el detalle enlaza al servicio correcto y conserva los cambios.
4. Con un servicio de prueba controlado, revisar la caída, recuperación y
   automatizaciones vinculadas, sin provocar indisponibilidad en servicios reales.
5. Consultar Loki y Tempo con sus etiquetas verificadas; comprobar también los
   estados vacíos y una traza cuyo detalle siga retenido.
6. Confirmar que n8n mantiene respuestas 200 en sus ejecuciones periódicas y que
   Argo CD queda `Synced / Healthy`.
