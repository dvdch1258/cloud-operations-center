export const servicesResources = {
  en: {
    services: {
      eyebrow: "SERVICE INVENTORY",
      title: "Services",
      subtitle:
        "Manage and monitor the platform components.",

      updated: "Updated · {{time}}",
      lastManualCheck: "Manual check · {{time}}",
      checking: "Checking...",
      checkNow: "Check now",
      newService: "New service",
      error: "Error",

      status: {
        up: "Operational",
        down: "Down",
        unknown: "Unknown",
      },

      types: {
        api: "API",
        database: "Database",
        frontend: "Frontend",
        monitoring: "Monitoring",
        other: "Other",
      },

      kpi: {
        services: "Services",
        registered: "Registered services",
        operational: "Operational",
        healthyDescription: "Running correctly",
        down: "Down",
        downDescription: "Require attention",
        averageUptime: "Average uptime · 1h",
        monitoredAvailability:
          "Monitored availability",
        noMeasurements: "No measurements",
      },

      form: {
        editEyebrow: "EDIT",
        createEyebrow: "ADD SERVICE",
        editTitle: "Edit service",
        createTitle: "New service",

        editDescription:
          "Update the monitored component configuration.",
        createDescription:
          "Register a new endpoint for monitoring.",

        close: "Close form",
        name: "Name",
        type: "Type",
        endpoint: "Endpoint",
        endpointPlaceholder:
          "http://service:port",
        status: "Status",

        cancel: "Cancel",
        saving: "Saving...",
        save: "Save changes",
        create: "Create service",
      },

      inventory: {
        eyebrow: "MONITORED INVENTORY",
        title: "Registered services",
        description:
          "Status, availability and telemetry for each component.",

        service_one: "service",
        service_other: "services",

        loading: "Loading services...",
        emptyTitle:
          "No services registered",
        emptyDescription:
          "Add the first component to start monitoring it.",
      },

      table: {
        service: "Service",
        status: "Status",
        uptime1h: "Uptime · 1h",
        latency: "Latency",
        lastCheck: "Last check",
        actions: "Actions",

        averageLastHour:
          "Last hour average",
        monitoring: "Monitoring",

        detail: "Details",
        edit: "Edit",
        delete: "Delete",
      },

      confirmDelete:
        "Are you sure you want to delete {{name}}?",

      noData: "No data",
    },

    serviceDetail: {
      back: "← Services",
      backFull: "← Back to services",

      eyebrow: "OPERATIONAL DETAIL",

      loading:
        "Loading service information...",
      loadError:
        "Unable to load service",
      updateError:
        "Update error",

      refreshing: "Refreshing...",
      refresh: "Refresh",
      updated: "Updated {{time}}",
      waiting: "Waiting for data",

      status: {
        up: "Operational",
        down: "Down",
        unknown: "Unknown",
      },

      noData: "No data",

      uptime1h: "Uptime 1 hour",
      uptime24h: "Uptime 24 hours",

      checks_one: "{{count}} check",
      checks_other: "{{count}} checks",

      availableChecks_one:
        "{{count}} available check",
      availableChecks_other:
        "{{count}} available checks",

      averageLatency:
        "Average latency",
      averageLastHour:
        "Average during the last hour",

      lastCheck:
        "Last check",
      latestAutomaticCheck:
        "Most recent automatic check",

      latencyEvolution:
        "Latency evolution",
      lastChecks:
        "Last {{count}} checks",
      current:
        "Current: {{value}}",

      chartEmpty:
        "There are not enough checks yet to show a trend.",
      chartAria:
        "Latency evolution",

      recentHistory:
        "Recent history",
      latestChecks:
        "Latest checks",

      table: {
        time: "Time",
        status: "Status",
        http: "HTTP",
        latency: "Latency",
        detail: "Detail",
      },

      noErrors: "No errors",
      noChecks:
        "No checks exist yet.",
    },
  },

  es: {
    services: {
      eyebrow: "INVENTARIO DE SERVICIOS",
      title: "Servicios",
      subtitle:
        "Gestiona y supervisa los componentes de la plataforma.",

      updated: "Actualizado · {{time}}",
      lastManualCheck: "Comprobación manual · {{time}}",
      checking: "Comprobando...",
      checkNow: "Comprobar ahora",
      newService: "Nuevo servicio",
      error: "Error",

      status: {
        up: "Operativo",
        down: "Caído",
        unknown: "Desconocido",
      },

      types: {
        api: "API",
        database: "Base de datos",
        frontend: "Frontend",
        monitoring: "Monitorización",
        other: "Otro",
      },

      kpi: {
        services: "Servicios",
        registered: "Servicios registrados",
        operational: "Operativos",
        healthyDescription:
          "Funcionando correctamente",
        down: "Caídos",
        downDescription:
          "Requieren atención",
        averageUptime: "Uptime medio · 1h",
        monitoredAvailability:
          "Disponibilidad monitorizada",
        noMeasurements: "Sin mediciones",
      },

      form: {
        editEyebrow: "EDICIÓN",
        createEyebrow: "ALTA DE SERVICIO",
        editTitle: "Editar servicio",
        createTitle: "Nuevo servicio",

        editDescription:
          "Actualiza la configuración del componente monitorizado.",
        createDescription:
          "Registra un nuevo endpoint para incorporarlo a la monitorización.",

        close: "Cerrar formulario",
        name: "Nombre",
        type: "Tipo",
        endpoint: "Endpoint",
        endpointPlaceholder:
          "http://servicio:puerto",
        status: "Estado",

        cancel: "Cancelar",
        saving: "Guardando...",
        save: "Guardar cambios",
        create: "Crear servicio",
      },

      inventory: {
        eyebrow: "INVENTARIO MONITORIZADO",
        title: "Servicios registrados",
        description:
          "Estado, disponibilidad y telemetría de cada componente.",

        service_one: "servicio",
        service_other: "servicios",

        loading: "Cargando servicios...",
        emptyTitle:
          "No hay servicios registrados",
        emptyDescription:
          "Añade el primer componente para comenzar a monitorizarlo.",
      },

      table: {
        service: "Servicio",
        status: "Estado",
        uptime1h: "Uptime · 1h",
        latency: "Latencia",
        lastCheck: "Último check",
        actions: "Acciones",

        averageLastHour:
          "Media última hora",
        monitoring: "Monitorización",

        detail: "Detalle",
        edit: "Editar",
        delete: "Eliminar",
      },

      confirmDelete:
        "¿Seguro que quieres eliminar {{name}}?",

      noData: "Sin datos",
    },

    serviceDetail: {
      back: "← Servicios",
      backFull: "← Volver a servicios",

      eyebrow: "DETALLE OPERATIVO",

      loading:
        "Cargando información del servicio...",
      loadError:
        "No se pudo cargar el servicio",
      updateError:
        "Error de actualización",

      refreshing: "Actualizando...",
      refresh: "Actualizar",
      updated: "Actualizado {{time}}",
      waiting: "Esperando datos",

      status: {
        up: "Operativo",
        down: "Caído",
        unknown: "Desconocido",
      },

      noData: "Sin datos",

      uptime1h: "Uptime 1 hora",
      uptime24h: "Uptime 24 horas",

      checks_one: "{{count}} comprobación",
      checks_other: "{{count}} comprobaciones",

      availableChecks_one:
        "{{count}} comprobación disponible",
      availableChecks_other:
        "{{count}} comprobaciones disponibles",

      averageLatency:
        "Latencia media",
      averageLastHour:
        "Media durante la última hora",

      lastCheck:
        "Último check",
      latestAutomaticCheck:
        "Comprobación automática más reciente",

      latencyEvolution:
        "Evolución de latencia",
      lastChecks:
        "Últimas {{count}} comprobaciones",
      current:
        "Actual: {{value}}",

      chartEmpty:
        "Aún no hay suficientes comprobaciones para mostrar una tendencia.",
      chartAria:
        "Evolución de la latencia",

      recentHistory:
        "Histórico reciente",
      latestChecks:
        "Últimas comprobaciones",

      table: {
        time: "Hora",
        status: "Estado",
        http: "HTTP",
        latency: "Latencia",
        detail: "Detalle",
      },

      noErrors: "Sin errores",
      noChecks:
        "Aún no existen comprobaciones.",
    },
  },
};
