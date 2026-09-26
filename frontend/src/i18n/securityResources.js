export const securityResources = {
  en: {
    security: {
      common: {
        unknown: "Unknown",
        noData: "No data",
      },

      severity: {
        info: "Info",
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
        unknown: "Unknown",
      },

      events: {
        login_success: "Sign in",
        login_failed: "Failed sign in",
        login_blocked: "Blocked sign in",
        account_locked: "Account locked",
        account_unlocked: "Account unlocked",
      },

      page: {
        eyebrow: "SECURITY OPERATIONS",
        title: "Security",
        subtitle:
          "Security posture, exposure, controls and recent platform activity.",
        refreshing: "Refreshing...",
        refresh: "Refresh",
        errorHeading:
          "Could not load Security",
        live: "LIVE",
      },

      errors: {
        load:
          "Could not load the Security Command Center.",
      },

      state: {
        kicker: "CURRENT POSTURE",
        stable: "Security posture stable",
        attention: "Security activity detected",
        description:
          "Continuous monitoring of authentication, account protection and security controls.",
        events24h: "Events · 24h",
        lastAlert: "Last alert",
        environment: "Production",
      },

      metrics: {
        events24h: "Events · 24h",
        authenticationActivity: "Recorded authentication activity",
        failedLogins24h: "Failed sign-ins · 24h",
        failedAuthenticationAttempts: "Failed authentication attempts",
        activeAlerts: "Active alerts",
        openOrAcknowledged: "Open or acknowledged",
        highCritical: "High + Critical",
        highestSeverityFindings: "Highest-severity findings",
      },

      posture: {
        eyebrow: "SECURITY POSTURE",
        title: "Security posture",
        badge: "POSTURE SCORE",
        stats: {
          critical: "Critical findings",
          alerts: "Active alerts",
          compliance: "Compliance",
        },
        status: {
          stable: "Stable posture",
        },
      },

      radar: {
        eyebrow: "REAL-TIME SIGNALS",
        title: "Security radar",
        status: "SCANNING",
        core: "LIVE",
      },

      exposure: {
        eyebrow: "VULNERABILITY EXPOSURE",
        title: "Risk distribution",
        description: "Findings from the latest available scan by component.",
        viewFindings: "View findings →",
        totalFindings: "Total findings",
        fixAvailable: "Fix available",
        components: "Components",
        lastScan: "LAST SCAN",
      },

      controlPlane: {
        eyebrow: "CONTROL PLANE",
        title: "Governance status",
        description: "Compliance and effective security policies.",
        controlStatus: "CONTROL STATUS",
        evaluating: "Evaluating controls...",
        loadingPolicies: "Loading policies...",
        complianceSummary: "{{passed}} passed · {{failed}} failed",
        policySummary: "{{enforced}} enforced · {{enabled}} enabled",
      },

      activityUi: {
        alertsEyebrow: "ACTIVE DETECTIONS",
        alertsTitle: "Alert stream",
        alertsDescription: "Latest signals recorded by security controls.",
        viewAlerts: "View alerts →",
        loadingAlerts: "Loading alerts...",
        noAlerts: "No alerts recorded",
        noAlertsHint: "New detections will appear here.",
        activityEyebrow: "AUTHENTICATION AUDIT",
        activityTitle: "Security activity",
        activityDescription: "Recent authentication system events.",
        loadingActivity: "Loading activity...",
        noEvents: "No recent events",
        noEventsHint: "Activity will appear here.",
        workspaceEyebrow: "SECURITY WORKSPACE",
        workspaceTitle: "Investigate each layer",
        workspaceDescription: "Explore exposure, detection, controls and governance in detail.",
        eventCount_one: "{{count}} EVENT",
        eventCount_other: "{{count}} EVENTS",
        system: "system",
        ipUnavailable: "IP unavailable",
        security: "Security",
        statusOpen: "Open",
        statusAcknowledged: "Acknowledged",
        statusResolved: "Resolved",
        exposureEyebrow: "EXPOSURE",
        exposureTitle: "Vulnerabilities",
        exposureDescription: "Detected findings, severity, components and versions with fixes.",
        detectionEyebrow: "DETECTION",
        detectionTitle: "Alerts",
        detectionDescription: "Active signals requiring acknowledgement or operational resolution.",
        controlEyebrow: "CONTROL",
        controlTitle: "Compliance",
        controlDescription: "Technical controls evaluated against the actual platform state.",
        governanceEyebrow: "GOVERNANCE",
        governanceTitle: "Policies",
        governanceDescription: "Effective policies applied by security controls.",
      },

      finalUi: {
        noActivity: "no activity",
        unknownDate: "unknown date",
        now: "now",
        minutesAgo: "{{count}} min ago",
        hoursAgo: "{{count}} h ago",
        daysAgo: "{{count}} d ago",
        lastScan: "Last scan",
        lastEvaluation: "Last evaluation",
        passedControls: "Passed controls",
        failedControls: "Failed controls",
        totalControls: "Total controls",
        lockedAccounts: "Locked accounts",
        complianceScore: "Compliance {{score}}%",
      },

      stateUi: {
        criticalLabel: "Critical attention required",
        criticalDescription: "There are active critical signals across the security surface.",
        warningLabel: "Review recommended",
        warningDescription: "There are signals requiring operational follow-up.",
        healthyLabel: "Stable posture",
        healthyDescription: "There are no active critical or high signals in the current controls.",
      },

      sections: {
        vulnerabilities: {
          title: "Vulnerabilities",
          description:
            "Detected vulnerabilities and current platform exposure.",
        },

        alerts: {
          title: "Alerts",
          description:
            "Active security alerts requiring operational attention.",
        },

        compliance: {
          title: "Compliance",
          description:
            "Technical security controls and their current compliance status.",
        },

        policies: {
          title: "Policies",
          description:
            "Effective policies applied by platform security controls.",
        },
      },

      time: {
        waiting: "Waiting for data",
      },
    },
  },

  es: {
    security: {
      common: {
        unknown: "Desconocido",
        noData: "Sin datos",
      },

      severity: {
        info: "Info",
        low: "Baja",
        medium: "Media",
        high: "Alta",
        critical: "Crítica",
        unknown: "Desconocida",
      },

      events: {
        login_success: "Inicio de sesión",
        login_failed: "Inicio de sesión fallido",
        login_blocked: "Inicio de sesión bloqueado",
        account_locked: "Cuenta bloqueada",
        account_unlocked: "Cuenta desbloqueada",
      },

      page: {
        eyebrow: "OPERACIONES DE SEGURIDAD",
        title: "Seguridad",
        subtitle:
          "Postura de seguridad, exposición, controles y actividad reciente de la plataforma.",
        refreshing: "Actualizando...",
        refresh: "Actualizar",
        errorHeading:
          "No se pudo cargar Seguridad",
        live: "EN VIVO",
      },

      errors: {
        load:
          "No se pudo cargar el centro de operaciones de seguridad.",
      },

      state: {
        kicker: "POSTURA ACTUAL",
        stable: "Postura de seguridad estable",
        attention: "Actividad de seguridad detectada",
        description:
          "Monitorización continua de autenticación, protección de cuentas y controles de seguridad.",
        events24h: "Eventos · 24h",
        lastAlert: "Última alerta",
        environment: "Producción",
      },

      metrics: {
        events24h: "Eventos · 24h",
        authenticationActivity: "Actividad de autenticación registrada",
        failedLogins24h: "Accesos fallidos · 24h",
        failedAuthenticationAttempts: "Intentos de autenticación fallidos",
        activeAlerts: "Alertas activas",
        openOrAcknowledged: "Abiertas o reconocidas",
        highCritical: "Altas + críticas",
        highestSeverityFindings: "Hallazgos de mayor severidad",
      },

      posture: {
        eyebrow: "POSTURA DE SEGURIDAD",
        title: "Postura de seguridad",
        badge: "PUNTUACIÓN",
        stats: {
          critical: "Hallazgos críticos",
          alerts: "Alertas activas",
          compliance: "Cumplimiento",
        },
        status: {
          stable: "Postura estable",
        },
      },

      radar: {
        eyebrow: "SEÑALES EN TIEMPO REAL",
        title: "Radar de seguridad",
        status: "ESCANEANDO",
        core: "EN VIVO",
      },

      exposure: {
        eyebrow: "EXPOSICIÓN A VULNERABILIDADES",
        title: "Distribución del riesgo",
        description: "Hallazgos del último escaneo disponible por componente.",
        viewFindings: "Ver hallazgos →",
        totalFindings: "Total de hallazgos",
        fixAvailable: "Corrección disponible",
        components: "Componentes",
        lastScan: "ÚLTIMO ESCANEO",
      },

      controlPlane: {
        eyebrow: "PLANO DE CONTROL",
        title: "Estado de gobernanza",
        description: "Cumplimiento y políticas de seguridad efectivas.",
        controlStatus: "ESTADO DE LOS CONTROLES",
        evaluating: "Evaluando controles...",
        loadingPolicies: "Cargando políticas...",
        complianceSummary: "{{passed}} superados · {{failed}} fallidos",
        policySummary: "{{enforced}} aplicadas · {{enabled}} habilitadas",
      },

      activityUi: {
        alertsEyebrow: "DETECCIONES ACTIVAS",
        alertsTitle: "Flujo de alertas",
        alertsDescription: "Últimas señales registradas por los controles de seguridad.",
        viewAlerts: "Ver alertas →",
        loadingAlerts: "Cargando alertas...",
        noAlerts: "No hay alertas registradas",
        noAlertsHint: "Las nuevas detecciones aparecerán aquí.",
        activityEyebrow: "AUDITORÍA DE AUTENTICACIÓN",
        activityTitle: "Actividad de seguridad",
        activityDescription: "Eventos recientes del sistema de autenticación.",
        loadingActivity: "Cargando actividad...",
        noEvents: "Sin eventos recientes",
        noEventsHint: "La actividad aparecerá aquí.",
        workspaceEyebrow: "ESPACIO DE SEGURIDAD",
        workspaceTitle: "Investiga cada capa",
        workspaceDescription: "Accede al detalle de exposición, detección, controles y gobierno.",
        eventCount_one: "{{count}} EVENTO",
        eventCount_other: "{{count}} EVENTOS",
        system: "sistema",
        ipUnavailable: "IP no disponible",
        security: "Seguridad",
        statusOpen: "Abierta",
        statusAcknowledged: "Reconocida",
        statusResolved: "Resuelta",
        exposureEyebrow: "EXPOSICIÓN",
        exposureTitle: "Vulnerabilidades",
        exposureDescription: "Hallazgos detectados, severidad, componentes y versiones con corrección.",
        detectionEyebrow: "DETECCIÓN",
        detectionTitle: "Alertas",
        detectionDescription: "Señales activas que requieren reconocimiento o resolución operativa.",
        controlEyebrow: "CONTROL",
        controlTitle: "Cumplimiento",
        controlDescription: "Controles técnicos evaluados contra el estado real de la plataforma.",
        governanceEyebrow: "GOBERNANZA",
        governanceTitle: "Políticas",
        governanceDescription: "Políticas efectivas aplicadas por los controles de seguridad.",
      },

      finalUi: {
        noActivity: "sin actividad",
        unknownDate: "fecha desconocida",
        now: "ahora",
        minutesAgo: "hace {{count}} min",
        hoursAgo: "hace {{count}} h",
        daysAgo: "hace {{count}} d",
        lastScan: "Último escaneo",
        lastEvaluation: "Última evaluación",
        passedControls: "Controles superados",
        failedControls: "Controles fallidos",
        totalControls: "Total de controles",
        lockedAccounts: "Cuentas bloqueadas",
        complianceScore: "Cumplimiento {{score}}%",
      },

      stateUi: {
        criticalLabel: "Atención crítica",
        criticalDescription: "Hay señales críticas activas en la superficie de seguridad.",
        warningLabel: "Revisión recomendada",
        warningDescription: "Hay señales que requieren seguimiento operativo.",
        healthyLabel: "Postura estable",
        healthyDescription: "No hay señales críticas o altas activas en los controles actuales.",
      },

      sections: {
        vulnerabilities: {
          title: "Vulnerabilidades",
          description:
            "Vulnerabilidades detectadas y exposición actual de la plataforma.",
        },

        alerts: {
          title: "Alertas",
          description:
            "Alertas de seguridad activas que requieren atención operativa.",
        },

        compliance: {
          title: "Cumplimiento",
          description:
            "Controles técnicos de seguridad y su estado actual de cumplimiento.",
        },

        policies: {
          title: "Políticas",
          description:
            "Políticas efectivas aplicadas por los controles de seguridad.",
        },
      },

      time: {
        waiting: "Esperando datos",
      },
    },
  },
};

export default securityResources;
