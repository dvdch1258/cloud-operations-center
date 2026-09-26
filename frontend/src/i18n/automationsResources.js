export const automationsResources = {
  en: {
    automations: {
      common: {
        unknown: "Unknown",
      },

      service: {
        all: "All services",
        fallback: "Service #{{id}}",
        test: "Test service",
      },

      page: {
        eyebrow: "AUTOMATION",
        title: "Automations",
        subtitle:
          "Define operational rules and review every execution performed by the platform.",
        refreshing: "Refreshing...",
        refresh: "Refresh",
        successHeading: "Automation",
      },

      summary: {
        rules: "Rules",
        rulesDescription: "Configured automations",
        active: "Active",
        activeDescription: "Rules evaluated by the engine",
        executions: "Executions",
        executionsDescription: "Recorded history",
        failed: "Failed",
        failedDescription: "Actions requiring review",
      },

      form: {
        eyebrow: "NEW RULE",
        title: "Create automation",
        description:
          "Define when the platform should react automatically.",

        name: "Name",
        namePlaceholder:
          "E.g. Notify Backend API outage",

        descriptionLabel: "Description",
        descriptionPlaceholder:
          "Briefly describe what this automation does.",

        service: "Service",
        cooldown: "Cooldown",
        cooldownHint:
          "Prevents repeated automatic executions for the same service.",

        trigger: "Trigger",
        action: "Action",

        creating: "Creating...",
        create: "Create automation",

        cooldownOptions: {
          disabled: "Disabled",
          oneMinute: "1 minute",
          fiveMinutes: "5 minutes",
          fifteenMinutes: "15 minutes",
          oneHour: "1 hour",
        },
      },

      engine: {
        eyebrow: "ENGINE",
        title: "Automation status",
        description:
          "Operational flow for configured rules.",

        detect: "Detect",
        detectDescription:
          "The checker detects a real transition to down.",

        evaluate: "Evaluate",
        evaluateDescription:
          "The engine finds active rules applicable to the service.",

        act: "Act",
        actDescription:
          "The configured action runs through the secure webhook.",

        audit: "Audit",
        auditDescription:
          "Result, duration and errors are persisted.",

        latestExecution: "Latest execution",
        noExecutions: "No executions",
        waitingActivity: "Waiting for activity",
      },

      rules: {
        title: "Rules",
        description:
          "Active configuration of the automation engine.",

        count_one: "{{count}} rule",
        count_other: "{{count}} rules",

        loading: "Loading rules...",
        empty: "No automations configured.",

        active: "Active",
        inactive: "Inactive",
        noDescription: "No description",

        trigger: "Trigger",
        action: "Action",
        scope: "Scope",
        cooldown: "Cooldown",
        createdBy: "Created by",

        testService: "Test service",

        testing: "Testing...",
        test: "Test",

        processing: "Processing...",
        deactivate: "Deactivate",
        activate: "Activate",

        delete: "Delete",
      },

      history: {
        title: "Execution history",
        description:
          "Auditable result of every triggered automation.",

        filterStatus: "Status",
        filterAll: "All",

        loading: "Loading history...",
        empty: "No executions to display.",

        columns: {
          rule: "Rule",
          status: "Status",
          source: "Source",
          trigger: "Trigger",
          service: "Service",
          duration: "Duration",
          started: "Started",
        },

        openDetailAria:
          "Open execution details",
      },

      detail: {
        eyebrow: "EXECUTION DETAIL",
        title: "Execution #{{id}}",
        closeAria: "Close execution details",

        loading: "Loading execution details...",
        errorHeading:
          "Could not update execution details",

        status: "Status",
        source: "Source",
        rule: "Rule",
        trigger: "Trigger",
        service: "Service",
        duration: "Duration",
        started: "Started",
        finished: "Finished",

        cooldownProtection: {
          eyebrow: "COOLDOWN PROTECTION",
          title: "Skipped due to cooldown",
          reason: "Reason",
          active: "Cooldown active",
          previousExecution: "Previous execution",
        },

        manualTest: {
          eyebrow: "MANUAL TEST",
          title: "Execution started by user",
          description:
            "This execution was not triggered by a real change in service state.",
        },

        automatic: {
          eyebrow: "AUTOMATIC TRIGGER",
          title: "Automatic execution",
          description:
            "Execution triggered by an operational service transition.",
        },

        cooldown: "Cooldown",
        configuredTrigger: "Configured trigger",

        executionError: "Execution error",
        triggerPayload: "Trigger payload",
        result: "Result",
      },

      executionStatus: {
        success: "Completed",
        failed: "Failed",
        running: "Running",
        skipped: "Skipped",
      },

      trigger: {
        service_down: "Service down",
        service_recovered: "Service recovered",
      },

      action: {
        notify_webhook: "Notify webhook",
      },

      executionSource: {
        manual_test: "Manual test",
        trigger: "Automatic",
      },

      cooldown: {
        disabled: "Disabled",
        hour_one: "{{count}} hour",
        hour_other: "{{count}} hours",
        minute_one: "{{count}} minute",
        minute_other: "{{count}} minutes",
      },

      messages: {
        created:
          "Automation created successfully.",

        disabled:
          "Automation disabled.",

        enabled:
          "Automation enabled.",

        testServiceRequired:
          "Select a service to test this global rule.",

        testSuccess:
          'Test for "{{name}}" completed successfully.',

        testFailed:
          'Test for "{{name}}" failed.',

        deleteConfirm:
          'Delete automation "{{name}}"?',

        deleted:
          "Automation deleted. Its history remains available.",
      },

      errors: {
        load:
          "Unable to load automation data.",
        action:
          "Unable to complete the action",
        detail:
          "Unable to update the details",
      },
    },
  },

  es: {
    automations: {
      common: {
        unknown: "Desconocido",
      },

      service: {
        all: "Todos los servicios",
        fallback: "Servicio #{{id}}",
        test: "Servicio de prueba",
      },

      page: {
        eyebrow: "AUTOMATION",
        title: "Automatizaciones",
        subtitle:
          "Define reglas operativas y consulta cada ejecución realizada por la plataforma.",
        refreshing: "Actualizando...",
        refresh: "Actualizar",
        successHeading: "Automation",
      },

      summary: {
        rules: "Reglas",
        rulesDescription: "Automatizaciones configuradas",
        active: "Activas",
        activeDescription: "Reglas evaluadas por el motor",
        executions: "Ejecuciones",
        executionsDescription: "Historial registrado",
        failed: "Fallidas",
        failedDescription: "Acciones que requieren revisión",
      },

      form: {
        eyebrow: "NUEVA REGLA",
        title: "Crear automatización",
        description:
          "Define cuándo debe reaccionar automáticamente la plataforma.",

        name: "Nombre",
        namePlaceholder:
          "Ej. Avisar caída Backend API",

        descriptionLabel: "Descripción",
        descriptionPlaceholder:
          "Describe brevemente qué hace esta automatización.",

        service: "Servicio",
        cooldown: "Cooldown",
        cooldownHint:
          "Evita ejecuciones automáticas repetidas para el mismo servicio.",

        trigger: "Trigger",
        action: "Acción",

        creating: "Creando...",
        create: "Crear automatización",

        cooldownOptions: {
          disabled: "Desactivado",
          oneMinute: "1 minuto",
          fiveMinutes: "5 minutos",
          fifteenMinutes: "15 minutos",
          oneHour: "1 hora",
        },
      },

      engine: {
        eyebrow: "MOTOR",
        title: "Estado de Automation",
        description:
          "Flujo operativo de las reglas configuradas.",

        detect: "Detectar",
        detectDescription:
          "El checker detecta una transición real hacia down.",

        evaluate: "Evaluar",
        evaluateDescription:
          "El motor localiza las reglas activas aplicables al servicio.",

        act: "Actuar",
        actDescription:
          "La acción configurada se ejecuta mediante el webhook seguro.",

        audit: "Auditar",
        auditDescription:
          "Resultado, duración y errores quedan persistidos.",

        latestExecution: "Última ejecución",
        noExecutions: "Sin ejecuciones",
        waitingActivity: "Esperando actividad",
      },

      rules: {
        title: "Reglas",
        description:
          "Configuración activa del motor de automatización.",

        count_one: "{{count}} regla",
        count_other: "{{count}} reglas",

        loading: "Cargando reglas...",
        empty: "No hay automatizaciones configuradas.",

        active: "Activa",
        inactive: "Inactiva",
        noDescription: "Sin descripción",

        trigger: "Trigger",
        action: "Acción",
        scope: "Ámbito",
        cooldown: "Cooldown",
        createdBy: "Creada por",

        testService: "Servicio de prueba",

        testing: "Probando...",
        test: "Probar",

        processing: "Procesando...",
        deactivate: "Desactivar",
        activate: "Activar",

        delete: "Eliminar",
      },

      history: {
        title: "Historial de ejecuciones",
        description:
          "Resultado auditable de cada automatización disparada.",

        filterStatus: "Estado",
        filterAll: "Todos",

        loading: "Cargando historial...",
        empty: "No hay ejecuciones para mostrar.",

        columns: {
          rule: "Regla",
          status: "Estado",
          source: "Fuente",
          trigger: "Trigger",
          service: "Servicio",
          duration: "Duración",
          started: "Inicio",
        },

        openDetailAria:
          "Abrir detalle de ejecución",
      },

      detail: {
        eyebrow: "DETALLE DE EJECUCIÓN",
        title: "Ejecución #{{id}}",
        closeAria: "Cerrar detalle de ejecución",

        loading: "Cargando detalle de ejecución...",
        errorHeading:
          "No se pudo actualizar el detalle",

        status: "Estado",
        source: "Fuente",
        rule: "Regla",
        trigger: "Trigger",
        service: "Servicio",
        duration: "Duración",
        started: "Inicio",
        finished: "Finalización",

        cooldownProtection: {
          eyebrow: "PROTECCIÓN ANTI-TORMENTA",
          title: "Omitida por cooldown",
          reason: "Motivo",
          active: "Cooldown activo",
          previousExecution: "Ejecución anterior",
        },

        manualTest: {
          eyebrow: "PRUEBA MANUAL",
          title: "Ejecución iniciada por usuario",
          description:
            "Esta ejecución no fue provocada por un cambio real de estado del servicio.",
        },

        automatic: {
          eyebrow: "DISPARO AUTOMÁTICO",
          title: "Ejecución automática",
          description:
            "Ejecución disparada por una transición operativa del servicio.",
        },

        cooldown: "Cooldown",
        configuredTrigger: "Trigger configurado",

        executionError: "Error de ejecución",
        triggerPayload: "Payload del trigger",
        result: "Resultado",
      },

      executionStatus: {
        success: "Completada",
        failed: "Fallida",
        running: "En ejecución",
        skipped: "Omitida",
      },

      trigger: {
        service_down: "Servicio caído",
        service_recovered: "Servicio recuperado",
      },

      action: {
        notify_webhook: "Notificar webhook",
      },

      executionSource: {
        manual_test: "Prueba manual",
        trigger: "Automática",
      },

      cooldown: {
        disabled: "Desactivado",
        hour_one: "{{count}} hora",
        hour_other: "{{count}} horas",
        minute_one: "{{count}} minuto",
        minute_other: "{{count}} minutos",
      },

      messages: {
        created:
          "Automatización creada correctamente.",

        disabled:
          "Automatización desactivada.",

        enabled:
          "Automatización activada.",

        testServiceRequired:
          "Selecciona un servicio para probar esta regla global.",

        testSuccess:
          'Prueba de "{{name}}" completada correctamente.',

        testFailed:
          'La prueba de "{{name}}" falló.',

        deleteConfirm:
          '¿Eliminar la automatización "{{name}}"?',

        deleted:
          "Automatización eliminada. Su historial permanece disponible.",
      },

      errors: {
        load:
          "No se pudieron cargar los datos de automatización.",
        action:
          "No se pudo completar la acción",
        detail:
          "No se pudo actualizar el detalle",
      },
    },
  },
};
