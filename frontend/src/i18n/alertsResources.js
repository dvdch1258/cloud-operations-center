export const alertsResources = {
  en: {
    alerts: {
      eyebrow: "SECURITY OPERATIONS",
      title: "Alerts",
      subtitle:
        "Active security alerts generated automatically by the platform.",

      refreshing: "Refreshing...",
      refresh: "Refresh",

      errors: {
        load:
          "Unable to load the alerts.",
        update:
          "Unable to update the alert.",
        heading:
          "Unable to process the alerts",
      },

      severity: {
        CRITICAL: "Critical",
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low",
        UNKNOWN: "Unknown",
      },

      status: {
        open: "Open",
        acknowledged: "Acknowledged",
        resolved: "Resolved",
      },

      kpi: {
        total: "Total alerts",
        totalDescription:
          "Recorded history",

        open: "Open",
        openDescription:
          "Pending action",

        acknowledged: "Acknowledged",
        acknowledgedDescription:
          "Under review",

        resolved: "Resolved",
        resolvedDescription:
          "No active risk",

        criticalActive:
          "Active critical",
        criticalActiveDescription:
          "Immediate priority",

        highActive:
          "Active high",
        highActiveDescription:
          "Elevated risk",
      },

      inventory: {
        eyebrow: "SECURITY ALERTING",
        title: "Detected alerts",
        description:
          "Operational status of automatically detected risks.",

        results_one: "{{count}} result",
        results_other: "{{count}} results",

        lastActivity:
          "Last activity:",

        loading:
          "Loading alerts...",

        empty:
          "No alerts match these filters.",
      },

      filters: {
        allStatuses:
          "All statuses",
        allSeverities:
          "All severities",
        allComponents:
          "All components",

        backend: "Backend",
        frontend: "Frontend",
      },

      table: {
        severity: "Severity",
        alert: "Alert",
        component: "Component",
        package: "Package",
        status: "Status",
        lastSeen:
          "Last detected",
        actions: "Actions",
      },

      actions: {
        acknowledge: "Acknowledge",
        resolve: "Resolve",
        none: "No actions",
      },
    },
  },

  es: {
    alerts: {
      eyebrow: "OPERACIONES DE SEGURIDAD",
      title: "Alertas",
      subtitle:
        "Alertas de seguridad activas generadas automáticamente por la plataforma.",

      refreshing: "Actualizando...",
      refresh: "Actualizar",

      errors: {
        load:
          "No se pudieron cargar las alertas.",
        update:
          "No se pudo actualizar la alerta.",
        heading:
          "No se pudieron procesar las alertas",
      },

      severity: {
        CRITICAL: "Crítica",
        HIGH: "Alta",
        MEDIUM: "Media",
        LOW: "Baja",
        UNKNOWN: "Desconocida",
      },

      status: {
        open: "Abierta",
        acknowledged: "Reconocida",
        resolved: "Resuelta",
      },

      kpi: {
        total: "Total alertas",
        totalDescription:
          "Histórico registrado",

        open: "Abiertas",
        openDescription:
          "Pendientes de actuación",

        acknowledged: "Reconocidas",
        acknowledgedDescription:
          "En revisión",

        resolved: "Resueltas",
        resolvedDescription:
          "Sin riesgo activo",

        criticalActive:
          "Críticas activas",
        criticalActiveDescription:
          "Prioridad inmediata",

        highActive:
          "Altas activas",
        highActiveDescription:
          "Riesgo elevado",
      },

      inventory: {
        eyebrow: "ALERTAS DE SEGURIDAD",
        title: "Alertas detectadas",
        description:
          "Estado operativo de los riesgos detectados automáticamente.",

        results_one: "{{count}} resultado",
        results_other: "{{count}} resultados",

        lastActivity:
          "Última actividad:",

        loading:
          "Cargando alertas...",

        empty:
          "No hay alertas para estos filtros.",
      },

      filters: {
        allStatuses:
          "Todos los estados",
        allSeverities:
          "Todas las severidades",
        allComponents:
          "Todos los componentes",

        backend: "Backend",
        frontend: "Frontend",
      },

      table: {
        severity: "Severidad",
        alert: "Alerta",
        component: "Componente",
        package: "Paquete",
        status: "Estado",
        lastSeen:
          "Última detección",
        actions: "Acciones",
      },

      actions: {
        acknowledge: "Reconocer",
        resolve: "Resolver",
        none: "Sin acciones",
      },
    },
  },
};
