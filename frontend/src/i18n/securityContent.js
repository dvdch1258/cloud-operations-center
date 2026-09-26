// Localize known API text; preserve unknown content and technical values.
const controls = {
  "AUTH-001": {
    "title": [
      "Secreto JWT configurado",
      "JWT secret configured"
    ],
    "recommendation": [
      "Mantener el secreto fuera del código y gestionado mediante Kubernetes Secret.",
      "Keep the secret outside the source code and manage it using a Kubernetes Secret."
    ]
  },
  "AUTH-002": {
    "title": [
      "Usuarios activos disponibles",
      "Active users available"
    ],
    "recommendation": [
      "Mantener al menos una cuenta activa y revisar periódicamente las cuentas.",
      "Maintain at least one active account and review accounts regularly."
    ]
  },
  "SECR-001": {
    "title": [
      "Ingestión de vulnerabilidades protegida",
      "Protected vulnerability ingestion"
    ],
    "recommendation": [
      "Mantener la clave en Kubernetes Secret y rotarla periódicamente.",
      "Keep the key in a Kubernetes Secret and rotate it regularly."
    ]
  },
  "VULN-003": {
    "title": [
      "Sin vulnerabilidades críticas activas",
      "No active critical vulnerabilities"
    ],
    "recommendation": [
      "Priorizar la corrección de todas las vulnerabilidades críticas.",
      "Prioritize fixing all critical vulnerabilities."
    ]
  },
  "VULN-004": {
    "title": [
      "Sin vulnerabilidades altas activas",
      "No active high-severity vulnerabilities"
    ],
    "recommendation": [
      "Planificar y aplicar las correcciones disponibles para vulnerabilidades HIGH.",
      "Plan and apply available fixes for HIGH-severity vulnerabilities."
    ]
  },
  "VULN-001": {
    "title": [
      "Scan reciente de backend",
      "Recent backend scan"
    ],
    "recommendation": [
      "Mantener un análisis Trivy automático con antigüedad inferior a 24 horas.",
      "Maintain an automated Trivy scan less than 24 hours old."
    ]
  },
  "VULN-002": {
    "title": [
      "Scan reciente de frontend",
      "Recent frontend scan"
    ],
    "recommendation": [
      "Mantener un análisis Trivy automático con antigüedad inferior a 24 horas.",
      "Maintain an automated Trivy scan less than 24 hours old."
    ]
  }
};

const policies = {
  "POL-AUTH-001": {
    "name": [
      "Límite de intentos de acceso",
      "Sign-in attempt limit"
    ],
    "description": [
      "Número máximo de intentos fallidos antes de bloquear temporalmente una cuenta.",
      "Maximum number of failed attempts before temporarily locking an account."
    ]
  },
  "POL-AUTH-002": {
    "name": [
      "Duración del bloqueo",
      "Lockout duration"
    ],
    "description": [
      "Tiempo durante el que una cuenta permanece bloqueada tras superar el límite de intentos.",
      "How long an account remains locked after exceeding the attempt limit."
    ]
  },
  "POL-VULN-001": {
    "name": [
      "Umbral de alertas de vulnerabilidad",
      "Vulnerability alert threshold"
    ],
    "description": [
      "Severidades de Trivy que generan alertas operativas.",
      "Trivy severity levels that generate operational alerts."
    ]
  },
  "POL-VULN-002": {
    "name": [
      "Resolución automática de alertas",
      "Automatic alert resolution"
    ],
    "description": [
      "Resuelve automáticamente una alerta cuando la vulnerabilidad deja de aparecer en el siguiente scan.",
      "Automatically resolves an alert when the vulnerability no longer appears in the next scan."
    ]
  },
  "POL-SCAN-001": {
    "name": [
      "Antigüedad máxima del scan",
      "Maximum scan age"
    ],
    "description": [
      "Tiempo máximo admitido para considerar reciente un análisis de vulnerabilidades.",
      "Maximum permitted age for a vulnerability scan to be considered recent."
    ]
  }
};

const staticEvidence = {
  "AUTH-001": [
    [
      "JWT_SECRET_KEY está configurado con una longitud adecuada.",
      "JWT_SECRET_KEY is configured with an adequate length."
    ],
    [
      "JWT_SECRET_KEY no está configurado o es demasiado corto.",
      "JWT_SECRET_KEY is not configured or is too short."
    ]
  ],
  "SECR-001": [
    [
      "La API interna de ingestión dispone de una clave configurada.",
      "The internal ingestion API has a configured key."
    ],
    [
      "No se detecta una clave válida para la ingestión de vulnerabilidades.",
      "No valid key was detected for vulnerability ingestion."
    ]
  ]
};


function isEnglish(language) {
  return String(language || "").toLowerCase().split("-")[0] === "en";
}

function knownField(catalog, id, field, original) {
  const entry = catalog[id]?.[field];
  return Array.isArray(entry) && original === entry[0]
    ? entry[1]
    : original;
}

export function controlText(control, field, language) {
  const original = control[field] ?? "";
  if (!isEnglish(language)) return original;

  const id = control.control_id;
  if (field !== "evidence") {
    return knownField(controls, id, field, original);
  }

  const fixed = staticEvidence[id]?.find(([source]) => source === original);
  if (fixed) return fixed[1];

  if (id === "AUTH-002") {
    const match = /^(\d+) usuario\(s\) activo\(s\) registrado\(s\)\.$/.exec(original);
    if (match) {
      return `${match[1]} active ${Number(match[1]) === 1 ? "user" : "users"} registered.`;
    }
  }

  if (id === "VULN-001" || id === "VULN-002") {
    const component = id === "VULN-001" ? "backend" : "frontend";
    if (original === `No existe ningún scan de ${component}.`) {
      return `No ${component} scan exists.`;
    }
    const match = /^Último scan de (backend|frontend): (.+), hace (\d+(?:\.\d+)?) h\.$/.exec(original);
    if (match && match[1] === component) {
      return `Latest ${component} scan: ${match[2]}, ${match[3]} h ago.`;
    }
  }

  if (id === "VULN-003" || id === "VULN-004") {
    const severity = id === "VULN-003" ? "CRITICAL" : "HIGH";
    const match = /^(\d+) alerta\(s\) (CRITICAL|HIGH) activa\(s\)\.$/.exec(original);
    if (match && match[2] === severity) {
      return `${match[1]} active ${severity} ${Number(match[1]) === 1 ? "alert" : "alerts"}.`;
    }
  }

  // Never invent evidence if the API wording changes.
  return original;
}

export function policyText(policy, field, language) {
  const original = policy[field] ?? "";
  return isEnglish(language)
    ? knownField(policies, policy.policy_id, field, original)
    : original;
}

export function policySource(source, language) {
  const spanish = String(language || "").toLowerCase().startsWith("es");
  if (source === "configuration") return spanish ? "Configuración" : "Configuration";
  if (source === "application_policy") return spanish ? "Política de la aplicación" : "Application policy";
  return source;
}
