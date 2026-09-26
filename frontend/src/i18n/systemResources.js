export const systemResources = {
  en: {
    system: {
      eyebrow: "PLATFORM",
      title: "System",
      subtitle:
        "Platform version, infrastructure and health information.",

      refreshing: "Refreshing...",
      refresh: "Refresh",

      errors: {
        load:
          "Unable to retrieve the system status.",
        heading:
          "Unable to retrieve the system status",
      },

      status: {
        operational: "Operational",
        degraded: "Degraded",
        unavailable: "Unavailable",
        noData: "No data",
      },

      platform: {
        operational:
          "Platform operational",
        degraded:
          "Platform degraded",
        lastUpdated:
          "Last update: {{time}}",
        waitingData:
          "Waiting for data",
      },

      meta: {
        version: "Version",
        versionDescription:
          "Application release",

        build: "Build",
        buildDescription:
          "Deployed commit",

        environment: "Environment",
        environmentDescription:
          "Runtime environment",

        orchestration: "Orchestration",
        orchestrationDescription:
          "Namespace cloud-ops",
      },

      components: {
        title:
          "Component health",
        description:
          "Checks retrieved from the backend",

        databaseDescription:
          "Primary persistence",
        prometheusDescription:
          "Metrics and alerts",
        tempoDescription:
          "Distributed traces",
      },

      observability: {
        title: "Observability",
        description:
          "Access the platform's operational tools.",

        openGrafana:
          "Open Grafana",
        openPrometheus:
          "Open Prometheus",
        openArgoCd:
          "Open Argo CD",
      },

      architecture: {
        title:
          "Operational architecture",
        description:
          "Main Cloud Operations Center components",

        application: "Application",
        persistence: "Persistence",
        gitops: "GitOps",
        metrics: "Metrics",
        logs: "Logs",
        tracing: "Tracing",
        alerts: "Alerts",
        automation: "Automation",
      },
    },
  },

  es: {
    system: {
      eyebrow: "PLATAFORMA",
      title: "Sistema",
      subtitle:
        "Información de versión, infraestructura y salud de la plataforma.",

      refreshing: "Actualizando...",
      refresh: "Actualizar",

      errors: {
        load:
          "No se pudo obtener el estado del sistema.",
        heading:
          "No se pudo obtener el estado del sistema",
      },

      status: {
        operational: "Operativo",
        degraded: "Degradado",
        unavailable: "No disponible",
        noData: "Sin datos",
      },

      platform: {
        operational:
          "Plataforma operativa",
        degraded:
          "Plataforma degradada",
        lastUpdated:
          "Última actualización: {{time}}",
        waitingData:
          "Esperando datos",
      },

      meta: {
        version: "Versión",
        versionDescription:
          "Release de la aplicación",

        build: "Build",
        buildDescription:
          "Commit desplegado",

        environment: "Entorno",
        environmentDescription:
          "Entorno de ejecución",

        orchestration: "Orquestación",
        orchestrationDescription:
          "Namespace cloud-ops",
      },

      components: {
        title:
          "Salud de componentes",
        description:
          "Comprobaciones obtenidas desde el backend",

        databaseDescription:
          "Persistencia principal",
        prometheusDescription:
          "Métricas y alertas",
        tempoDescription:
          "Trazas distribuidas",
      },

      observability: {
        title: "Observabilidad",
        description:
          "Acceso a las herramientas operativas de la plataforma.",

        openGrafana:
          "Abrir Grafana",
        openPrometheus:
          "Abrir Prometheus",
        openArgoCd:
          "Abrir Argo CD",
      },

      architecture: {
        title:
          "Arquitectura operacional",
        description:
          "Componentes principales del Cloud Operations Center",

        application: "Aplicación",
        persistence: "Persistencia",
        gitops: "GitOps",
        metrics: "Métricas",
        logs: "Logs",
        tracing: "Tracing",
        alerts: "Alertas",
        automation: "Automatización",
      },
    },
  },
};
