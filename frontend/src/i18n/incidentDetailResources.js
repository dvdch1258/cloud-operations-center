export const incidentDetailResources = {
  en: {
    incidentDetail: {
      status: {
        open: "Open",
        investigating: "Investigating",
        resolved: "Resolved",
        closed: "Closed",
      },

      severity: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      },

      source: {
        user: "Operator",
        checker: "Checker",
        automation: "Automation",
        legacy: "Historical",
      },

      executionStatus: {
        running: "Running",
        success: "Successful",
        failed: "Failed",
        skipped: "Skipped",
      },

      fields: {
        title: "Title",
        description: "Description",
        severity: "Severity",
        status: "Status",
        service_id: "Service",
      },

      tabs: {
        timeline: "Timeline",
        correlation: "Correlation",
        automations: "Automations",
        logs: "Logs · Loki",
        traces: "Traces · Tempo",
      },

      common: {
        retry: "Retry",
        openTrace: "Open trace",
        ongoing: "Ongoing",
        unassigned: "Unassigned",
        results: "{{count}} results",
      },

      traceDetail: {
        title: "Trace details",
        unavailable:
          "This trace is no longer available in Tempo or has not been indexed yet.",
        loading: "Querying trace in Tempo…",
        loadError: "Could not load the trace",
      },

      telemetry: {
        serviceContextLogs:
          "Service context · Loki service_name label",
        serviceContextTraces:
          "Service context · Tempo service.name",
        placeholderLogs:
          "Optional, for example backend",
        placeholderTraces:
          "Optional: exact instrumentation name",
        query: "Query",
        incidentOnly: "Only this incident",

        filteredHint:
          "Context for “{{filter}}” during the incident window. It may include activity that does not belong to this incident.",
        logsHint:
          "Application events identified with this incident. You can also query a service context by entering its exact label.",
        tracesHint:
          "Traces captured in this incident's events. A monitored service name may differ from its name in Tempo.",

        loadingLogs: "Querying logs in Loki…",
        loadingTraces: "Querying traces in Tempo…",

        errorLogs: "Could not query the logs",
        errorTraces: "Could not query the traces",

        contextWindow:
          "Context window: {{start}} — {{end}}.",
        windowTruncated:
          " Limited to the last 7 days of the incident window.",
        windowExtended:
          " Includes up to 5 minutes before creation and after resolution.",

        resultSummary:
          "{{count}} results · Maximum {{max}}",

        emptyLogs:
          "No logs are available for this query. Older events may fall outside Loki retention.",
        emptyTraces:
          "No traces are available for this query. Active instrumentation and retained Tempo data are required.",

        logsTitle: "Loki logs",
        tracesTitle: "Tempo traces",
      },

      page: {
        back: "← All incidents",

        notFound:
          "This incident does not exist or has been deleted.",

        loadError:
          "Could not load the incident",
        operationError:
          "Could not complete the operation",

        loadingTitle:
          "Loading incident",
        loadingDescription:
          "Retrieving context, timeline and automations…",

        eyebrow:
          "OPERATIONS / INCIDENT #{{id}}",

        refreshing: "Refreshing…",
        refresh: "Refresh",

        affectedService:
          "AFFECTED SERVICE",
        currentStatus:
          "Current status: {{status}}",
        missingService:
          "Deleted or unassigned service",
        historyPreserved:
          "The incident history is preserved.",

        created: "Created",
        resolution: "Resolution",

        description: "Description",

        investigate: "Investigate",
        resolve: "Resolve",
        close: "Close",
        reopen: "Reopen",

        navigationAria:
          "Incident information",
      },

      timeline: {
        title: "Timeline",
        newestFirst: "Newest first",

        noteLabel:
          "Investigation note",
        notePlaceholder:
          "What have you observed and what have you checked…",
        saving: "Saving…",
        addNote: "Add note",

        empty:
          "No events have been recorded yet.",

        legacyHint:
          "Date preserved from the previous record; the author and intermediate steps are not available.",

        execution:
          "Execution #{{id}}",
        viewTrace:
          "View trace",

        loadOlder:
          "Load previous events",
      },

      automations: {
        title:
          "Linked automations",

        hint:
          "Executions associated with the incident through the trigger. Older executions without an explicit link are not automatically attributed.",

        empty:
          "This incident has no linked automations.",

        executionError:
          "Error recorded in the execution",

        triggerAndResult:
          "Trigger and result",

        loadMore:
          "Load more executions",
      },

      correlation: {
        loading:
          "Correlating incident with Loki and Tempo…",

        title:
          "Operational correlation",

        description:
          "Context automatically observed during the incident time window.",

        sourcesAria:
          "Source status",

        sourceStatus: {
          available: "Available",
          unavailable: "Unavailable",
          skipped: "Not queried",
        },

        window:
          "Correlation window: {{start}} — {{end}}.",
        windowTruncated:
          " Limited to the last 7 days.",
        windowExtended:
          " Includes up to 5 minutes before creation and after resolution.",

        summary: {
          logs: "Logs",
          errors: "Errors",
          tempoTraces: "Tempo traces",
          capturedTraces: "Captured traces",
          prioritySignals: "Priority signals",
        },

        priority: {
          title: "Priority signals",

          description:
            "Evidence ranked by relevance for investigation first. The ranking does not imply causality.",

          empty:
            "No signals with sufficient relevance were found during this window.",

          relevance:
            "Relevance {{score}}",

          sourceIncident: "Incident",
          kindTrace: "Trace",
          kindLog: "Log",

          technicalStatus:
            "Status {{value}}",
          technicalLevel:
            "Level {{value}}",
          spans:
            "{{count}} spans",
        },

        relatedLogs: {
          title:
            "Related logs · Loki",

          unavailable:
            "Loki is currently unavailable. Correlation continues with the other sources.",

          empty:
            "No related logs were found during this window.",
        },

        relatedTraces: {
          title:
            "Related traces · Tempo",

          unavailable:
            "Tempo is currently unavailable. Logs and captured traces remain available.",

          skipped:
            "Tempo was not queried because the incident currently has no affected service.",

          empty:
            "No service traces were found during this window.",
        },

        capturedTraces: {
          title:
            "Traces captured by the incident",

          description:
            "Trace IDs recorded directly in incident events, independently of the current Tempo query.",

          empty:
            "This incident does not yet have trace IDs captured in its timeline.",
        },
      },
    },
  },

  es: {
    incidentDetail: {
      status: {
        open: "Abierto",
        investigating: "Investigando",
        resolved: "Resuelto",
        closed: "Cerrado",
      },

      severity: {
        low: "Baja",
        medium: "Media",
        high: "Alta",
        critical: "Crítica",
      },

      source: {
        user: "Operador",
        checker: "Comprobador",
        automation: "Automatización",
        legacy: "Histórico",
      },

      executionStatus: {
        running: "En ejecución",
        success: "Correcta",
        failed: "Fallida",
        skipped: "Omitida",
      },

      fields: {
        title: "Título",
        description: "Descripción",
        severity: "Severidad",
        status: "Estado",
        service_id: "Servicio",
      },

      tabs: {
        timeline: "Línea temporal",
        correlation: "Correlación",
        automations: "Automatizaciones",
        logs: "Logs · Loki",
        traces: "Trazas · Tempo",
      },

      common: {
        retry: "Reintentar",
        openTrace: "Abrir traza",
        ongoing: "En curso",
        unassigned: "Sin asignar",
        results: "{{count}} resultados",
      },

      traceDetail: {
        title: "Detalle de traza",
        unavailable:
          "Esta traza ya no está disponible en Tempo o aún no se ha indexado.",
        loading: "Consultando traza en Tempo…",
        loadError: "No se pudo cargar la traza",
      },

      telemetry: {
        serviceContextLogs:
          "Contexto del servicio · etiqueta Loki service_name",
        serviceContextTraces:
          "Contexto del servicio · nombre Tempo service.name",
        placeholderLogs:
          "Opcional, por ejemplo backend",
        placeholderTraces:
          "Opcional: nombre exacto de la instrumentación",
        query: "Consultar",
        incidentOnly: "Solo este incidente",

        filteredHint:
          "Contexto de «{{filter}}» durante la ventana del incidente. Puede incluir actividad que no pertenece a este incidente.",
        logsHint:
          "Eventos de la aplicación identificados con este incidente. Puedes consultar también el contexto de un servicio indicando su etiqueta exacta.",
        tracesHint:
          "Trazas capturadas en los eventos de este incidente. El nombre de un servicio monitorizado puede diferir de su nombre en Tempo.",

        loadingLogs:
          "Consultando logs en Loki…",
        loadingTraces:
          "Consultando trazas en Tempo…",

        errorLogs:
          "No se pudieron consultar los logs",
        errorTraces:
          "No se pudieron consultar las trazas",

        contextWindow:
          "Ventana de contexto: {{start}} — {{end}}.",
        windowTruncated:
          " Limitada a los últimos 7 días de la ventana del incidente.",
        windowExtended:
          " Incluye hasta 5 minutos antes de la creación y después de la resolución.",

        resultSummary:
          "{{count}} resultados · Máximo {{max}}",

        emptyLogs:
          "No hay logs disponibles para esta consulta. Los eventos antiguos pueden quedar fuera de la retención de Loki.",
        emptyTraces:
          "No hay trazas para esta consulta. Se necesita instrumentación activa y datos conservados en Tempo.",

        logsTitle: "Logs de Loki",
        tracesTitle: "Trazas de Tempo",
      },

      page: {
        back: "← Todos los incidentes",

        notFound:
          "Este incidente no existe o ha sido eliminado.",

        loadError:
          "No se pudo cargar el incidente",
        operationError:
          "No se pudo completar la operación",

        loadingTitle:
          "Cargando incidente",
        loadingDescription:
          "Recuperando contexto, línea temporal y automatizaciones…",

        eyebrow:
          "OPERACIONES / INCIDENTE #{{id}}",

        refreshing: "Actualizando…",
        refresh: "Actualizar",

        affectedService:
          "SERVICIO AFECTADO",
        currentStatus:
          "Estado actual: {{status}}",
        missingService:
          "Servicio eliminado o sin asignar",
        historyPreserved:
          "El historial del incidente se conserva.",

        created: "Creado",
        resolution: "Resolución",

        description: "Descripción",

        investigate: "Investigar",
        resolve: "Resolver",
        close: "Cerrar",
        reopen: "Reabrir",

        navigationAria:
          "Información del incidente",
      },

      timeline: {
        title: "Línea temporal",
        newestFirst: "Más reciente primero",

        noteLabel:
          "Nota de investigación",
        notePlaceholder:
          "Qué has observado y qué has comprobado…",
        saving: "Guardando…",
        addNote: "Añadir nota",

        empty:
          "Todavía no hay eventos registrados.",

        legacyHint:
          "Fecha conservada del registro anterior; el autor y los pasos intermedios no constan.",

        execution:
          "Ejecución #{{id}}",
        viewTrace:
          "Ver traza",

        loadOlder:
          "Cargar eventos anteriores",
      },

      automations: {
        title:
          "Automatizaciones vinculadas",

        hint:
          "Ejecuciones asociadas al incidente por el disparador. Las ejecuciones antiguas sin vínculo explícito no se atribuyen automáticamente.",

        empty:
          "Este incidente no tiene automatizaciones vinculadas.",

        executionError:
          "Error registrado en la ejecución",

        triggerAndResult:
          "Disparador y resultado",

        loadMore:
          "Cargar más ejecuciones",
      },

      correlation: {
        loading:
          "Correlacionando incidente con Loki y Tempo…",

        title:
          "Correlación operativa",

        description:
          "Contexto observado automáticamente durante la ventana temporal del incidente.",

        sourcesAria:
          "Estado de las fuentes",

        sourceStatus: {
          available: "Disponible",
          unavailable: "No disponible",
          skipped: "No consultado",
        },

        window:
          "Ventana de correlación: {{start}} — {{end}}.",
        windowTruncated:
          " Limitada a los últimos 7 días.",
        windowExtended:
          " Incluye hasta 5 minutos antes de la creación y después de la resolución.",

        summary: {
          logs: "Logs",
          errors: "Errores",
          tempoTraces: "Trazas Tempo",
          capturedTraces: "Trazas capturadas",
          prioritySignals: "Señales prioritarias",
        },

        priority: {
          title: "Señales prioritarias",

          description:
            "Evidencia ordenada por relevancia para investigar primero. El ranking no implica causalidad.",

          empty:
            "No se encontraron señales con relevancia suficiente durante esta ventana.",

          relevance:
            "Relevancia {{score}}",

          sourceIncident: "Incidente",
          kindTrace: "Traza",
          kindLog: "Log",

          technicalStatus:
            "Estado {{value}}",
          technicalLevel:
            "Nivel {{value}}",
          spans:
            "{{count}} spans",
        },

        relatedLogs: {
          title:
            "Logs relacionados · Loki",

          unavailable:
            "Loki no está disponible actualmente. La correlación continúa con las demás fuentes.",

          empty:
            "No se encontraron logs relacionados durante esta ventana.",
        },

        relatedTraces: {
          title:
            "Trazas relacionadas · Tempo",

          unavailable:
            "Tempo no está disponible actualmente. Los logs y las trazas capturadas siguen disponibles.",

          skipped:
            "Tempo no se ha consultado porque el incidente no tiene actualmente un servicio afectado.",

          empty:
            "No se encontraron trazas del servicio durante esta ventana.",
        },

        capturedTraces: {
          title:
            "Trazas capturadas por el incidente",

          description:
            "Trace IDs registrados directamente en eventos del incidente, independientemente de la búsqueda actual en Tempo.",

          empty:
            "Este incidente todavía no tiene trace IDs capturados en su línea temporal.",
        },
      },
    },
  },
};
