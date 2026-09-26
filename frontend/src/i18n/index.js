import observabilityResources from "./observabilityResources.js";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { servicesResources } from "./servicesResources";
import { incidentsResources } from "./incidentsResources";
import { incidentDetailResources } from "./incidentDetailResources";
import { policiesResources } from "./policiesResources";
import { vulnerabilitiesResources } from "./vulnerabilitiesResources";
import { alertsResources } from "./alertsResources";
import { complianceResources } from "./complianceResources";
import { systemResources } from "./systemResources";
import { automationsResources } from "./automationsResources";
import { securityResources } from "./securityResources";


const STORAGE_KEY = "cloudops_locale";


const resources = {
  en: {
    translation: {
      language: {
        selector: "Language",
        english: "English",
        spanish: "Spanish",
      },

      common: {
        user: "User",
        refresh: "Refresh",
        refreshing: "Refreshing...",
        platform: "Platform",
        noDate: "No date",
        waitingForData: "Waiting for data",
      },

      status: {
        operational: "Operational",
        degraded: "Degraded",
        unavailable: "Unavailable",
        noData: "No data",
      },

      environment: {
        production: "Production",
        development: "Development",
        staging: "Staging",
      },

      nav: {
        overview: "Overview",
        services: "Services",
        incidents: "Incidents",
        security: "Security",
        activity: "Activity",
        activityDescription:
          "Authentication, lockouts and events.",
        vulnerabilities: "Vulnerabilities",
        alerts: "Alerts",
        compliance: "Compliance",
        policies: "Policies",
        operations: "Operations",
        automations: "Automations",
        observability: "Observability",
        system: "System",
        more: "More",
        mobileNavigationAria:
          "Main mobile navigation",
        openMoreSectionsAria:
          "Open more sections",
      },

      actions: {
        goToOverview: "Go to overview",
        openMenu: "Open menu",
        closeMenu: "Close menu",
        showSidebar: "Show sidebar",
        hideSidebar: "Hide sidebar",
        logout: "Log out",
      },

      login: {
        validating: "Validating session...",
        brandTagline: "Observability · Operations",
        eyebrow: "SECURE CONNECTION",
        title: "Sign in",
        description:
          "Sign in to access the operations center.",

        username: "Username",
        password: "Password",

        accessBlocked:
          "Access temporarily blocked",
        signInFailed:
          "Unable to sign in",

        retryIn:
          "You can try again in {{countdown}}",

        lockedButton:
          "Locked · {{countdown}}",
        submitting:
          "Signing in...",
        submit:
          "Sign in",

        encryptedConnection:
          "Encrypted connection · TLS",

        errors: {
          locked:
            "Account temporarily locked.",
          failed:
            "Unable to sign in.",
        },
      },

      summary: {
        title: "Overview",
        subtitle:
          "Operational status of the platform, infrastructure, incidents and security.",

        updated:
          "Updated · {{time}}",

        partialFailureTitle:
          "Some modules did not respond",

        partialFailureDescription:
          "Could not update: {{modules}}. The rest of the dashboard remains available.",

        modules: {
          overview: "overview",
          systemHealth: "system health",
          incidents: "incidents",
          services: "services",
          security: "security",
          securityActivity: "security activity",
        },

        hero: {
          label: "OVERALL STATUS",
          checking:
            "Checking platform...",
          operational:
            "All systems operational",
          attention:
            "The platform requires attention",
          healthyDescription:
            "No down services or active incidents detected.",
          attentionDescription:
            "{{servicesDown}} services down · {{activeIncidents}} active incidents",
        },

        kpi: {
          servicesRegistered:
            "Registered services",
          healthyServices:
            "Operational",
          available:
            "{{value}}% available",
          servicesDown:
            "Services down",
          interventionRequired:
            "Requires intervention",
          noInterruptions:
            "No interruptions",
          activeIncidents:
            "Active incidents",
          activeIncidentsDescription:
            "Open or under investigation",
          securityEvents:
            "Security events · 24h",
          activityRecorded:
            "Recorded activity",
          failedLogins:
            "Failed logins · 24h",
          reviewActivity:
            "Review activity",
          noAnomalousActivity:
            "No anomalous activity",
        },

        infrastructure: {
          eyebrow: "INFRASTRUCTURE",
          title: "Platform health",
          viewSystem: "View system →",

          database:
            "Primary database",
          prometheus:
            "Metrics and monitoring",
          tempo:
            "Distributed traces",

          availability:
            "Service availability",
          availabilityAria:
            "Availability {{value}}%",
          operationalServices:
            "{{up}} of {{total}} services operational",
        },

        incidents: {
          eyebrow: "INCIDENT MANAGEMENT",
          title: "Recent incidents",
          viewAll: "View all →",
          noneTitle: "No incidents",
          noneDescription:
            "No incidents are registered.",
          unassignedService:
            "Unassigned service",

          status: {
            open: "Open",
            investigating: "Investigating",
            resolved: "Resolved",
            closed: "Closed",
          },
        },

        security: {
          eyebrow: "SECURITY OPERATIONS",
          title: "Recent activity",
          viewSecurity: "View security →",
          noneTitle:
            "No recent events",
          noneDescription:
            "There is no recent security activity.",
          platform:
            "Platform",

          events: {
            loginSuccess: "Sign in",
            loginFailed: "Failed login",
            loginBlocked: "Blocked login",
            accountLocked: "Account locked",
            accountUnlocked: "Account unlocked",
          },

          severity: {
            info: "Info",
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
          },
        },

        quick: {
          eyebrow: "NAVIGATION",
          title: "Quick access",
          servicesHint:
            "Status and availability",
          incidentsHint:
            "Operational management",
          observabilityHint:
            "Logs, metrics and traces",
          securityHint:
            "Active lockouts",
          operations:
            "Control center",
          operationsHint:
            "Runs, checks and audit history",
          metrics:
            "Metrics",
        },
      },

      operations: {
        eyebrow: "OPERATIONS CONTROL",
        title: "Operations center",
        subtitle:
          "Run controlled actions, monitor their results and review platform operational activity.",
        lastRun: "Last run",
        refreshError: "The operation could not be completed",
        retry: "Retry",
        successTitle: "Operation completed",

        operation: {
          serviceHealthCheck: "Service health check",
          generic: "Operation",
        },

        status: {
          success: "Completed",
          failed: "Failed",
          running: "Running",
          unknown: "Unknown",
        },

        serviceStatus: {
          up: "Operational",
          down: "Unavailable",
          unknown: "Unknown",
        },

        successMessage:
          "Check completed: {{up}} operational, {{down}} unavailable.",

        kpi: {
          executions: "Executions",
          completed: "{{count}} completed",
          reliability: "Reliability",
          failed: "{{count}} failed",
          noFailures: "No failures recorded",
          services: "Services",
          serviceState:
            "{{up}} operational · {{down}} unavailable",
          waitingExecution: "Waiting for execution",
          automations: "Automations",
          issues: "{{count}} issues",
          latestExecution: "Latest execution",
        },

        overview: {
          waitingTitle: "Waiting for operational data",
          attentionTitle: "The latest execution requires attention",
          stableTitle: "Operation stable",
          waitingDescription:
            "Run a check to obtain the current status.",
          issuesDescription:
            "{{down}} services unavailable · {{issues}} automation issues",
          stableDescription:
            "{{up}}/{{checked}} services operational",
          execution: "Execution #{{id}}",
          noExecution: "No execution",
        },

        action: {
          eyebrow: "HEALTH CHECK",
          title: "Check services",
          description:
            "Run an immediate check of all registered services and update their status.",
          type: "Type",
          typeValue: "Controlled action",
          audit: "Audit",
          auditValue: "User and result",
          impact: "Impact",
          impactValue: "HTTP check",
          running: "Checking services...",
          run: "Check services",
        },

        latest: {
          eyebrow: "LATEST EXECUTION",
          title: "Operational result",
          subtitle: "Summary of the most recent check",
          empty: "There are no executions yet.",
          execution: "Execution",
          user: "User",
          duration: "Duration",
          date: "Date",
          servicesChecked: "Services checked",
          operational: "Operational",
          unavailable: "Unavailable",
          changesDetected: "Changes detected",
          statusChanges: "Status changes",
          statusChangesHint: "Services modified during the execution",
          noStatusChanges: "No status changes detected.",
          additionalChanges: "+{{count}} additional changes",
          incidents: "Incidents",
          incidentsHint: "Effects detected by the check",
          created: "Created",
          resolved: "Resolved",
          degraded: "Degraded",
          recovered: "Recovered",
          automations: "Automations",
          automationsHint: "Actions triggered by operational changes",
          events: "Events",
          executions: "Executions",
          failed: "Failed",
          errors: "Errors",
          executionError: "Execution error",
        },

        history: {
          eyebrow: "OPERATIONAL AUDIT",
          title: "Operations history",
          subtitle:
            "Explore executions and review the result for each service.",
          search: "Search",
          searchPlaceholder: "Operation, user or service...",
          status: "Status",
          all: "All",
          completed: "Completed",
          failed: "Failed",
          running: "Running",
          issuesOnly: "Issues only",
          loading: "Loading operations...",
          none: "No operations recorded.",
          noMatches: "No execution matches the filters.",
          operational: "operational",
          unavailable: "unavailable",
          duration: "duration",
          services: "Services",
          changes: "Changes",
          incidents: "Incidents",
          createdResolved: "created / resolved",
          automations: "Automations",
          problems: "{{count}} issues",
          executionError: "Execution error",
          servicesChecked: "Services checked",
          servicesCheckedHint: "Individual result for this execution",
          noServiceResults:
            "This execution does not contain individual service results.",
          serviceFallback: "Service #{{id}}",
          noEndpoint: "No endpoint",
          latency: "Latency",
          detail: "Detail",
          noErrors: "No errors",
        },
      },
    },
  },

  es: {
    translation: {
      language: {
        selector: "Idioma",
        english: "Inglés",
        spanish: "Español",
      },

      common: {
        user: "Usuario",
        refresh: "Actualizar",
        refreshing: "Actualizando...",
        platform: "Plataforma",
        noDate: "Sin fecha",
        waitingForData: "Esperando datos",
      },

      status: {
        operational: "Operativo",
        degraded: "Degradado",
        unavailable: "No disponible",
        noData: "Sin datos",
      },

      environment: {
        production: "Producción",
        development: "Desarrollo",
        staging: "Preproducción",
      },

      nav: {
        overview: "Resumen",
        services: "Servicios",
        incidents: "Incidentes",
        security: "Seguridad",
        activity: "Actividad",
        activityDescription:
          "Autenticación, bloqueos y eventos.",
        vulnerabilities: "Vulnerabilidades",
        alerts: "Alertas",
        compliance: "Compliance",
        policies: "Políticas",
        operations: "Operaciones",
        automations: "Automatizaciones",
        observability: "Observabilidad",
        system: "Sistema",
        more: "Más",
        mobileNavigationAria:
          "Navegación principal móvil",
        openMoreSectionsAria:
          "Abrir más secciones",
      },

      actions: {
        goToOverview: "Ir al resumen",
        openMenu: "Abrir menú",
        closeMenu: "Cerrar menú",
        showSidebar: "Mostrar barra lateral",
        hideSidebar: "Ocultar barra lateral",
        logout: "Cerrar sesión",
      },

      login: {
        validating: "Validando sesión...",
        brandTagline:
          "Observabilidad · Operaciones",
        eyebrow: "CONEXIÓN SEGURA",
        title: "Iniciar sesión",
        description:
          "Identifícate para acceder al centro de operaciones.",

        username: "Usuario",
        password: "Contraseña",

        accessBlocked:
          "Acceso temporalmente bloqueado",
        signInFailed:
          "No se pudo iniciar sesión",

        retryIn:
          "Puedes volver a intentarlo en {{countdown}}",

        lockedButton:
          "Bloqueado · {{countdown}}",
        submitting:
          "Iniciando sesión...",
        submit:
          "Entrar",

        encryptedConnection:
          "Conexión cifrada · TLS",

        errors: {
          locked:
            "Cuenta bloqueada temporalmente.",
          failed:
            "No se pudo iniciar sesión.",
        },
      },

      summary: {
        title: "Resumen",
        subtitle:
          "Estado operativo de la plataforma, infraestructura, incidentes y seguridad.",

        updated:
          "Actualizado · {{time}}",

        partialFailureTitle:
          "Algunos módulos no han respondido",

        partialFailureDescription:
          "No se pudieron actualizar: {{modules}}. El resto del dashboard continúa disponible.",

        modules: {
          overview: "resumen",
          systemHealth: "salud del sistema",
          incidents: "incidentes",
          services: "servicios",
          security: "seguridad",
          securityActivity: "actividad de seguridad",
        },

        hero: {
          label: "ESTADO GENERAL",
          checking:
            "Comprobando plataforma...",
          operational:
            "Todos los sistemas operativos",
          attention:
            "La plataforma requiere atención",
          healthyDescription:
            "No se detectan servicios caídos ni incidentes activos.",
          attentionDescription:
            "{{servicesDown}} servicios caídos · {{activeIncidents}} incidentes activos",
        },

        kpi: {
          servicesRegistered:
            "Servicios registrados",
          healthyServices:
            "Operativos",
          available:
            "{{value}}% disponibles",
          servicesDown:
            "Servicios caídos",
          interventionRequired:
            "Requieren intervención",
          noInterruptions:
            "Sin interrupciones",
          activeIncidents:
            "Incidentes activos",
          activeIncidentsDescription:
            "Abiertos o investigando",
          securityEvents:
            "Eventos seguridad · 24h",
          activityRecorded:
            "Actividad registrada",
          failedLogins:
            "Logins fallidos · 24h",
          reviewActivity:
            "Revisar actividad",
          noAnomalousActivity:
            "Sin actividad anómala",
        },

        infrastructure: {
          eyebrow: "INFRAESTRUCTURA",
          title: "Salud de la plataforma",
          viewSystem: "Ver sistema →",

          database:
            "Base de datos principal",
          prometheus:
            "Métricas y monitorización",
          tempo:
            "Trazas distribuidas",

          availability:
            "Disponibilidad de servicios",
          availabilityAria:
            "Disponibilidad {{value}}%",
          operationalServices:
            "{{up}} de {{total}} servicios operativos",
        },

        incidents: {
          eyebrow: "GESTIÓN DE INCIDENTES",
          title: "Incidentes recientes",
          viewAll: "Ver todos →",
          noneTitle: "Sin incidentes",
          noneDescription:
            "No hay incidentes registrados.",
          unassignedService:
            "Servicio sin asignar",

          status: {
            open: "Abierto",
            investigating: "Investigando",
            resolved: "Resuelto",
            closed: "Cerrado",
          },
        },

        security: {
          eyebrow:
            "OPERACIONES DE SEGURIDAD",
          title: "Actividad reciente",
          viewSecurity:
            "Ver seguridad →",
          noneTitle:
            "Sin eventos recientes",
          noneDescription:
            "No hay actividad de seguridad reciente.",
          platform:
            "Plataforma",

          events: {
            loginSuccess:
              "Inicio de sesión",
            loginFailed:
              "Login fallido",
            loginBlocked:
              "Login bloqueado",
            accountLocked:
              "Cuenta bloqueada",
            accountUnlocked:
              "Cuenta desbloqueada",
          },

          severity: {
            info: "Info",
            low: "Baja",
            medium: "Media",
            high: "Alta",
            critical: "Crítica",
          },
        },

        quick: {
          eyebrow: "NAVEGACIÓN",
          title: "Acceso rápido",
          servicesHint:
            "Estado y disponibilidad",
          incidentsHint:
            "Gestión operativa",
          observabilityHint:
            "Logs, métricas y trazas",
          securityHint:
            "Bloqueos activos",
          operations:
            "Centro de control",
          operationsHint:
            "Ejecuciones, checks y auditoría",
          metrics:
            "Métricas",
        },
      },

      operations: {
        eyebrow: "CONTROL DE OPERACIONES",
        title: "Centro de operaciones",
        subtitle:
          "Ejecuta acciones controladas, supervisa su resultado y revisa la actividad operativa de la plataforma.",
        lastRun: "Última ejecución",
        refreshError: "No se pudo completar la operación",
        retry: "Reintentar",
        successTitle: "Operación completada",

        operation: {
          serviceHealthCheck: "Comprobación de servicios",
          generic: "Operación",
        },

        status: {
          success: "Completada",
          failed: "Fallida",
          running: "En ejecución",
          unknown: "Desconocido",
        },

        serviceStatus: {
          up: "Operativo",
          down: "No disponible",
          unknown: "Desconocido",
        },

        successMessage:
          "Comprobación completada: {{up}} operativos, {{down}} no disponibles.",

        kpi: {
          executions: "Ejecuciones",
          completed: "{{count}} finalizadas",
          reliability: "Fiabilidad",
          failed: "{{count}} fallidas",
          noFailures: "Sin fallos registrados",
          services: "Servicios",
          serviceState:
            "{{up}} operativos · {{down}} no disponibles",
          waitingExecution: "Esperando ejecución",
          automations: "Automatizaciones",
          issues: "{{count}} incidencias",
          latestExecution: "Última ejecución",
        },

        overview: {
          waitingTitle: "Esperando datos operativos",
          attentionTitle: "La última ejecución requiere atención",
          stableTitle: "Operación estable",
          waitingDescription:
            "Ejecuta una comprobación para obtener el estado actual.",
          issuesDescription:
            "{{down}} servicios no disponibles · {{issues}} problemas de automatización",
          stableDescription:
            "{{up}}/{{checked}} servicios operativos",
          execution: "Ejecución #{{id}}",
          noExecution: "Sin ejecución",
        },

        action: {
          eyebrow: "HEALTH CHECK",
          title: "Comprobar servicios",
          description:
            "Ejecuta una comprobación inmediata de todos los servicios registrados y actualiza su estado.",
          type: "Tipo",
          typeValue: "Acción controlada",
          audit: "Auditoría",
          auditValue: "Usuario y resultado",
          impact: "Impacto",
          impactValue: "Comprobación HTTP",
          running: "Comprobando servicios...",
          run: "Comprobar servicios",
        },

        latest: {
          eyebrow: "ÚLTIMA EJECUCIÓN",
          title: "Resultado operativo",
          subtitle: "Resumen de la comprobación más reciente",
          empty: "Todavía no hay ejecuciones.",
          execution: "Ejecución",
          user: "Usuario",
          duration: "Duración",
          date: "Fecha",
          servicesChecked: "Servicios comprobados",
          operational: "Operativos",
          unavailable: "No disponibles",
          changesDetected: "Cambios detectados",
          statusChanges: "Cambios de estado",
          statusChangesHint: "Servicios modificados durante la ejecución",
          noStatusChanges: "No se detectaron cambios de estado.",
          additionalChanges: "+{{count}} cambios adicionales",
          incidents: "Incidentes",
          incidentsHint: "Efectos detectados por la comprobación",
          created: "Creados",
          resolved: "Resueltos",
          degraded: "Degradados",
          recovered: "Recuperados",
          automations: "Automatizaciones",
          automationsHint: "Acciones disparadas por cambios operativos",
          events: "Eventos",
          executions: "Ejecuciones",
          failed: "Fallidas",
          errors: "Errores",
          executionError: "Error de ejecución",
        },

        history: {
          eyebrow: "AUDITORÍA OPERATIVA",
          title: "Historial de operaciones",
          subtitle:
            "Explora ejecuciones y revisa el resultado de cada servicio.",
          search: "Buscar",
          searchPlaceholder: "Operación, usuario o servicio...",
          status: "Estado",
          all: "Todos",
          completed: "Completadas",
          failed: "Fallidas",
          running: "En ejecución",
          issuesOnly: "Solo con incidencias",
          loading: "Cargando operaciones...",
          none: "No hay operaciones registradas.",
          noMatches: "Ninguna ejecución coincide con los filtros.",
          operational: "operativos",
          unavailable: "no disponibles",
          duration: "duración",
          services: "Servicios",
          changes: "Cambios",
          incidents: "Incidentes",
          createdResolved: "creados / resueltos",
          automations: "Automatizaciones",
          problems: "{{count}} problemas",
          executionError: "Error de ejecución",
          servicesChecked: "Servicios comprobados",
          servicesCheckedHint: "Resultado individual de esta ejecución",
          noServiceResults:
            "Esta ejecución no contiene resultados individuales de servicios.",
          serviceFallback: "Servicio #{{id}}",
          noEndpoint: "Sin endpoint",
          latency: "Latencia",
          detail: "Detalle",
          noErrors: "Sin errores",
        },
      },
    },
  },
};


function initialLanguage() {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (
      stored === "es" ||
      stored === "en"
    ) {
      return stored;
    }
  } catch {
    // English remains the default if storage is unavailable.
  }

  return "en";
}


function normalizeLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es"
    : "en";
}


i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage(),
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    load: "languageOnly",

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });


/* FEATURE_RESOURCE_BUNDLES */
for (const language of ["en", "es"]) {
  i18n.addResourceBundle(
    language,
    "translation",
    observabilityResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    servicesResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    incidentsResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    incidentDetailResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    policiesResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    vulnerabilitiesResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    alertsResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    complianceResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    systemResources[language],
    true,
    true,
  );

  i18n.addResourceBundle(
    language,
    "translation",
    automationsResources[language],
    true,
    true,
  );

i18n.addResourceBundle(
    language,
    "translation",
    securityResources[language],
    true,
    true,
  );
}


function syncLanguage(language) {
  const normalized =
    normalizeLanguage(language);

  document.documentElement.lang =
    normalized;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      normalized,
    );
  } catch {
    // Language still works for the current session.
  }
}


syncLanguage(
  i18n.resolvedLanguage ||
  i18n.language,
);

i18n.on(
  "languageChanged",
  syncLanguage,
);


export {
  STORAGE_KEY,
};

export default i18n;
