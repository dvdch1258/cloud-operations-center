const API_URL =
  import.meta.env.VITE_API_URL || "/api";


async function request(path, options = {}) {
  const response = await fetch(
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

  if (
    response.status === 401 &&
    path !== "/auth/login"
  ) {
    window.dispatchEvent(
      new Event("auth:unauthorized")
    );
  }

  if (!response.ok) {
    let message =
      `Error HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // La respuesta puede no contener JSON.
    }

    const error = new Error(message);

    error.status = response.status;

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

  getObservabilityTimeseries: () =>
    request("/observability/timeseries"),

  getObservabilityServices: () =>
    request("/observability/services?hours=24"),

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
