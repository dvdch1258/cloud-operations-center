export const vulnerabilitiesResources = {
  en: {
    vulnerabilities: {
      eyebrow: "SECURITY OPERATIONS",
      title: "Vulnerabilities",
      subtitle:
        "Findings detected by Trivy in the deployed platform images.",

      refreshing: "Refreshing...",
      refresh: "Refresh",

      errors: {
        load:
          "Unable to load the vulnerabilities.",
        heading:
          "Unable to load the vulnerabilities",
      },

      severity: {
        CRITICAL: "Critical",
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low",
        UNKNOWN: "Unknown",
      },

      kpi: {
        total: "Total findings",
        totalDescription:
          "Latest scan per component",

        critical: "Critical",
        criticalDescription:
          "Immediate priority",

        high: "High",
        highDescription:
          "Elevated risk",

        medium: "Medium",
        mediumDescription:
          "Review recommended",

        low: "Low",
        lowDescription:
          "Reduced impact",

        fixAvailable: "Fix available",
        fixAvailableDescription:
          "Fixed version available",
      },

      inventory: {
        eyebrow: "CONTAINER SECURITY",
        title: "Detected findings",
        description:
          "Latest available backend and frontend analysis.",

        results_one: "{{count}} result",
        results_other: "{{count}} results",

        loading:
          "Loading vulnerabilities...",

        empty:
          "No vulnerabilities match these filters.",

        lastScan:
          "Last scan:",
      },

      filters: {
        allComponents:
          "All components",
        backend: "Backend",
        frontend: "Frontend",

        allSeverities:
          "All severities",

        anyFixStatus:
          "Any status",
        fixAvailable:
          "Fix available",
        noFixAvailable:
          "No fix available",
      },

      table: {
        severity: "Severity",
        cve: "CVE",
        component: "Component",
        package: "Package",
        installedVersion:
          "Installed version",
        fix: "Fix",
        status: "Status",
      },
    },
  },

  es: {
    vulnerabilities: {
      eyebrow: "OPERACIONES DE SEGURIDAD",
      title: "Vulnerabilidades",
      subtitle:
        "Hallazgos detectados por Trivy en las imágenes desplegadas de la plataforma.",

      refreshing: "Actualizando...",
      refresh: "Actualizar",

      errors: {
        load:
          "No se pudieron cargar las vulnerabilidades.",
        heading:
          "No se pudieron cargar las vulnerabilidades",
      },

      severity: {
        CRITICAL: "Crítica",
        HIGH: "Alta",
        MEDIUM: "Media",
        LOW: "Baja",
        UNKNOWN: "Desconocida",
      },

      kpi: {
        total: "Total hallazgos",
        totalDescription:
          "Último escaneo por componente",

        critical: "Críticas",
        criticalDescription:
          "Prioridad inmediata",

        high: "Altas",
        highDescription:
          "Riesgo elevado",

        medium: "Medias",
        mediumDescription:
          "Revisión recomendada",

        low: "Bajas",
        lowDescription:
          "Impacto reducido",

        fixAvailable: "Con solución",
        fixAvailableDescription:
          "Versión corregida disponible",
      },

      inventory: {
        eyebrow: "SEGURIDAD DE CONTENEDORES",
        title: "Hallazgos detectados",
        description:
          "Último análisis disponible de backend y frontend.",

        results_one: "{{count}} resultado",
        results_other: "{{count}} resultados",

        loading:
          "Cargando vulnerabilidades...",

        empty:
          "No hay vulnerabilidades para estos filtros.",

        lastScan:
          "Último escaneo:",
      },

      filters: {
        allComponents:
          "Todos los componentes",
        backend: "Backend",
        frontend: "Frontend",

        allSeverities:
          "Todas las severidades",

        anyFixStatus:
          "Cualquier estado",
        fixAvailable:
          "Con corrección disponible",
        noFixAvailable:
          "Sin corrección disponible",
      },

      table: {
        severity: "Severidad",
        cve: "CVE",
        component: "Componente",
        package: "Paquete",
        installedVersion:
          "Versión instalada",
        fix: "Corrección",
        status: "Estado",
      },
    },
  },
};
