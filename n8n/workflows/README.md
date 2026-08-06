# n8n workflows

## Cloud Ops - Alertas técnicas

La plantilla `cloud-ops-technical-alerts.template.json` no contiene credenciales, bot tokens ni identificadores locales.

Después de importarla en n8n es necesario:

1. Seleccionar una credencial de Telegram.
2. Configurar el Chat ID.
3. Revisar la ruta del webhook.
4. Guardar y publicar el workflow.
5. Configurar Alertmanager para usar la URL de producción.
