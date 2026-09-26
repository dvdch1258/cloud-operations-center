import i18n from "../i18n/index.js";

const API_URL =
  import.meta.env.VITE_API_URL || "/api";


/* V2_API_ERROR_NORMALIZATION */

function apiErrorMessage(status, path) {
  if (
    status === 401 &&
    path === "/auth/login"
  ) {
    return i18n.t(
      "apiErrors.invalidCredentials",
    );
  }

  const errorKeys = {
    400: "apiErrors.badRequest",
    401: "apiErrors.unauthorized",
    403: "apiErrors.forbidden",
    404: "apiErrors.notFound",
    409: "apiErrors.conflict",
    422: "apiErrors.validation",
    429: "apiErrors.rateLimit",
  };

  if (errorKeys[status]) {
    return i18n.t(errorKeys[status]);
  }

  if (status >= 500) {
    return i18n.t("apiErrors.server");
  }

  return i18n.t(
    "apiErrors.generic",
    { status },
  );
}


async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
    );
  } catch (cause) {
    const error = new Error(
      i18n.t("apiErrors.network"),
    );

    error.status = 0;
    error.networkError = true;

    error.detail =
      cause instanceof Error
        ? cause.message
        : String(cause);

    throw error;
  }

  if (
    response.status === 401 &&
    path !== "/auth/login"
  ) {
    window.dispatchEvent(
      new Event("auth:unauthorized")
    );
  }

  if (!response.ok) {
    let detail = null;

    try {
      const body = await response.json();

      if (
        body &&
        Object.prototype.hasOwnProperty.call(
          body,
          "detail",
        )
      ) {
        detail = body.detail;
      }
    } catch {
      // La respuesta puede no contener JSON.
    }

    const error = new Error(
      apiErrorMessage(
        response.status,
        path,
      ),
    );

    error.status = response.status;
    error.detail = detail;

    const retryAfterHeader =
      response.headers.get("Retry-After");

    if (retryAfterHeader) {
      const retryAfter = Number.parseInt(
        retryAfterHeader,
        10,
      );

      if (
        Number.isFinite(retryAfter) &&
        retryAfter > 0
      ) {
        error.retryAfter = retryAfter;
      }
    }

    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


export const api = {
  login: (
    username,
    password,
  ) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    request("/auth/me"),

  getSummary: () =>
    request("/dashboard/summary"),

  getDetailedHealth: () =>
    request("/health/detailed"),

  getOperationExecutions: (limit = 50) =>
    request(`/operations/executions?limit=${limit}`),

  runServiceHealthCheck: () =>
    request("/operations/service-check", {
      method: "POST",
    }),

  getSecuritySummary: () =>
    request("/security/summary"),

  getSecurityEvents: (limit = 50) =>
    request(`/security/events?limit=${limit}`),

  getVulnerabilitySummary: () =>
    request("/security/vulnerabilities/summary"),

  getVulnerabilities: (params = {}) => {
    const query = new URLSearchParams()

    if (params.component) {
      query.set("component", params.component)
    }

    if (params.severity) {
      query.set("severity", params.severity)
    }

    if (params.fixAvailable !== undefined) {
      query.set("fix_available", String(params.fixAvailable))
    }

    query.set("limit", String(params.limit || 100))

    return request(
      `/security/vulnerabilities?${query.toString()}`,
    )
  },

  getComplianceSummary: () =>
    request("/security/compliance/summary"),

  getSecurityPolicies: () =>
    request("/security/policies"),

  getObservabilitySummary: () =>
    request("/observability/summary"),

  getObservabilityTimeseries: (
    params = {},
  ) => {
    const query = new URLSearchParams()

    query.set(
      "hours",
      String(params.hours || 1),
    )

    return request(
      `/observability/timeseries?${query.toString()}`,
    )
  },

  getObservabilityServices: (
    params = {},
  ) => {
    const query = new URLSearchParams()

    query.set(
      "hours",
      String(params.hours || 24),
    )

    return request(
      `/observability/services?${query.toString()}`,
    )
  },

  getObservabilityLogs: (params = {}) => {
    const query = new URLSearchParams()

    query.set(
      "hours",
      String(params.hours || 1),
    )

    if (params.service) {
      query.set("service", params.service)
    }

    if (params.level) {
      query.set("level", params.level)
    }

    if (params.search) {
      query.set("search", params.search)
    }

    query.set(
      "limit",
      String(params.limit || 100),
    )

    return request(
      `/observability/logs?${query.toString()}`,
    )
  },

  getObservabilityTraces: (params = {}) => {
    const query = new URLSearchParams()

    query.set(
      "hours",
      String(params.hours || 1),
    )

    query.set(
      "limit",
      String(params.limit || 50),
    )

    if (params.service) {
      query.set(
        "service",
        params.service,
      )
    }

    return request(
      `/observability/traces?${query.toString()}`,
    )
  },

  getObservabilityTrace: (traceId) =>
    request(
      `/observability/traces/${traceId}`,
    ),


  getSecurityAlertSummary: () =>
    request("/security/alerts/summary"),

  getSecurityAlerts: (params = {}) => {
    const query = new URLSearchParams()

    if (params.status) {
      query.set("status", params.status)
    }

    if (params.severity) {
      query.set("severity", params.severity)
    }

    if (params.component) {
      query.set("component", params.component)
    }

    query.set("limit", String(params.limit || 100))

    return request(
      `/security/alerts?${query.toString()}`,
    )
  },

  acknowledgeSecurityAlert: (id) =>
    request(`/security/alerts/${id}/acknowledge`, {
      method: "PATCH",
    }),

  resolveSecurityAlert: (id) =>
    request(`/security/alerts/${id}/resolve`, {
      method: "PATCH",
    }),

  getAutomationRules: (params = {}) => {
    const query = new URLSearchParams()

    if (params.enabled !== undefined) {
      query.set(
        "enabled",
        String(params.enabled),
      )
    }

    query.set(
      "limit",
      String(params.limit || 100),
    )

    return request(
      `/automations/rules?${query.toString()}`,
    )
  },

  createAutomationRule: (payload) =>
    request("/automations/rules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateAutomationRule: (
    id,
    payload,
  ) =>
    request(`/automations/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteAutomationRule: (id) =>
    request(`/automations/rules/${id}`, {
      method: "DELETE",
    }),

  testAutomationRule: (
    id,
    payload = {},
  ) =>
    request(`/automations/rules/${id}/test`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAutomationExecutions: (params = {}) => {
    const query = new URLSearchParams()

    if (params.ruleId) {
      query.set(
        "rule_id",
        String(params.ruleId),
      )
    }

    if (params.status) {
      query.set(
        "status",
        params.status,
      )
    }

    query.set(
      "limit",
      String(params.limit || 100),
    )

    return request(
      `/automations/executions?${query.toString()}`,
    )
  },

  getAutomationExecution: (id) =>
    request(
      `/automations/executions/${id}`,
    ),

  getServices: () =>
    request("/services/"),

  getService: (id) =>
    request(`/services/${id}`),

  createService: (service) =>
    request("/services/", {
      method: "POST",
      body: JSON.stringify(service),
    }),

  getServiceUptime: (
    id,
    hours = 1,
  ) =>
    request(
      `/services/${id}/uptime?hours=${hours}`
    ),

  getServiceChecks: (
    id,
    limit = 100,
  ) =>
    request(
      `/services/${id}/checks?limit=${limit}`
    ),

  updateService: (
    id,
    service,
  ) =>
    request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(service),
    }),

  deleteService: (id) =>
    request(`/services/${id}`, {
      method: "DELETE",
    }),

  getIncidents: () =>
    request("/incidents/"),

  getIncidentDetails: (id) => request(`/incidents/${id}/details`),
  getIncidentCorrelation: (id) => request(`/incidents/${id}/correlation`),
  getIncidentTimeline: (id, offset = 0) => request(`/incidents/${id}/timeline?offset=${offset}`),
  getIncidentAutomations: (id, offset = 0) => request(`/incidents/${id}/automations?offset=${offset}`),
  changeIncidentStatus: (id, status) => request(`/incidents/${id}/status`, {
    method: "PATCH", body: JSON.stringify({ status }),
  }),
  addIncidentNote: (id, text) => request(`/incidents/${id}/notes`, {
    method: "POST", body: JSON.stringify({ text }),
  }),
  getIncidentLogs: (id, service = "") => request(
    `/incidents/${id}/logs?${new URLSearchParams(service ? { service } : {})}`,
  ),
  getIncidentTraces: (id, service = "") => request(
    `/incidents/${id}/traces?${new URLSearchParams(service ? { service } : {})}`,
  ),

  createIncident: (incident) =>
    request("/incidents/", {
      method: "POST",
      body: JSON.stringify(incident),
    }),

  updateIncident: (
    id,
    incident,
  ) =>
    request(`/incidents/${id}`, {
      method: "PUT",
      body: JSON.stringify(incident),
    }),

  deleteIncident: (id) =>
    request(`/incidents/${id}`, {
      method: "DELETE",
    }),
};
