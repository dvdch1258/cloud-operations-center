const API_URL =
  import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "cloud_ops_access_token";


export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}


export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}


export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}


async function request(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== "/auth/login") {
    clearAccessToken();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // La respuesta puede no contener JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


export const api = {
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    }),

  getMe: () => request("/auth/me"),

  getSummary: () => request("/dashboard/summary"),

  getServices: () => request("/services/"),
  getService: (id) => request(`/services/${id}`),

  createService: (service) =>
    request("/services/", {
      method: "POST",
      body: JSON.stringify(service),
    }),

  checkServices: () =>
    request("/services/check-all", {
      method: "POST",
    }),

  getServiceUptime: (id, hours = 1) =>
    request(`/services/${id}/uptime?hours=${hours}`),

  getServiceChecks: (id, limit = 100) =>
    request(`/services/${id}/checks?limit=${limit}`),

  updateService: (id, service) =>
    request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(service),
    }),

  deleteService: (id) =>
    request(`/services/${id}`, {
      method: "DELETE",
    }),

  getIncidents: () => request("/incidents/"),

  createIncident: (incident) =>
    request("/incidents/", {
      method: "POST",
      body: JSON.stringify(incident),
    }),

  updateIncident: (id, incident) =>
    request(`/incidents/${id}`, {
      method: "PUT",
      body: JSON.stringify(incident),
    }),

  deleteIncident: (id) =>
    request(`/incidents/${id}`, {
      method: "DELETE",
    }),
};
