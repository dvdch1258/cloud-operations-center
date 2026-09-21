import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { servicesResources } from "./servicesResources";


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
          metrics:
            "Metrics",
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
          metrics:
            "Métricas",
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


/* SERVICES_RESOURCE_BUNDLES */
for (const language of ["en", "es"]) {
  i18n.addResourceBundle(
    language,
    "translation",
    servicesResources[language],
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
