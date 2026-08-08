import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const emptyForm = {
  title: "",
  description: "",
  severity: "medium",
  service_id: "",
  status: "open",
};

const severityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels = {
  open: "Abierto",
  investigating: "Investigando",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const activeStatuses = new Set([
  "open",
  "investigating",
]);

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    severity: "all",
    service: "all",
  });

  const loadData = useCallback(async () => {
    try {
      const [incidentData, serviceData] = await Promise.all([
        api.getIncidents(),
        api.getServices(),
      ]);

      setIncidents(incidentData);
      setServices(serviceData);
      setLastUpdatedAt(new Date());
      setError("");

      setForm((current) => {
        if (current.service_id || !serviceData.length) {
          return current;
        }

        return {
          ...current,
          service_id: String(serviceData[0].id),
        };
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    loadData();

    const intervalId = window.setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing(incident) {
    setEditingId(incident.id);

    setForm({
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      service_id: String(incident.service_id),
      status: incident.status,
    });
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      service_id: services[0]
        ? String(services[0].id)
        : "",
    });
  }

  async function submitIncident(event) {
    event.preventDefault();

    if (!form.service_id) {
      setError("Selecciona un servicio.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      severity: form.severity,
      service_id: Number(form.service_id),
    };

    try {
      if (editingId) {
        await api.updateIncident(editingId, {
          ...payload,
          status: form.status,
        });
      } else {
        await api.createIncident(payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeIncident(id) {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este incidente?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.deleteIncident(id);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function serviceName(id) {
    return (
      services.find(
        (service) => service.id === id
      )?.name || `#${id}`
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  }

  function formatDuration(createdAt, resolvedAt) {
    if (!createdAt) {
      return "—";
    }

    const start = new Date(createdAt);
    const end = resolvedAt
      ? new Date(resolvedAt)
      : new Date();

    const totalSeconds = Math.max(
      0,
      Math.floor((end - start) / 1000)
    );

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days} d ${hours} h`;
    }

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }

    if (minutes > 0) {
      return `${minutes} min ${seconds} s`;
    }

    return `${seconds} s`;
  }

  async function changeIncidentStatus(incident, status) {
    if (updatingId === incident.id) {
      return;
    }

    setUpdatingId(incident.id);
    setError("");

    try {
      await api.updateIncident(incident.id, {
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        service_id: incident.service_id,
        status,
      });

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function renderIncident(incident) {
    return (
      <article
        className={
          `incident-card ` +
          `incident-card--${
            activeStatuses.has(incident.status)
              ? "active"
              : "resolved"
          }`
        }
        key={incident.id}
      >
        <div>
          <span
            className={
              `severity-badge ` +
              `severity-badge--${incident.severity}`
            }
          >
            {severityLabels[incident.severity] ||
              incident.severity}
          </span>

          <span
            className={
              `status-badge ` +
              `status-badge--${incident.status}`
            }
          >
            {statusLabels[incident.status] ||
              incident.status}
          </span>
        </div>

        <h3>{incident.title}</h3>

        <p>{incident.description}</p>

        <small>
          Servicio: {serviceName(incident.service_id)}
        </small>

        <div className="incident-meta">
          <div className="incident-meta__item">
            <span>Creado</span>
            <strong>
              {formatDateTime(incident.created_at)}
            </strong>
          </div>

          <div className="incident-meta__item">
            <span>
              {incident.resolved_at
                ? "Resuelto"
                : "Resolución"}
            </span>
            <strong>
              {incident.resolved_at
                ? formatDateTime(incident.resolved_at)
                : "En curso"}
            </strong>
          </div>

          <div className="incident-meta__item">
            <span>Duración</span>
            <strong>
              {formatDuration(
                incident.created_at,
                incident.resolved_at
              )}
            </strong>
          </div>
        </div>

        <div className="table-actions">
          {incident.status === "open" && (
            <button
              type="button"
              className="secondary-button"
              disabled={updatingId === incident.id}
              onClick={() =>
                changeIncidentStatus(
                  incident,
                  "investigating"
                )
              }
            >
              Investigar
            </button>
          )}

          {activeStatuses.has(incident.status) && (
            <button
              type="button"
              className="primary-button"
              disabled={updatingId === incident.id}
              onClick={() =>
                changeIncidentStatus(
                  incident,
                  "resolved"
                )
              }
            >
              Resolver
            </button>
          )}

          {incident.status === "resolved" && (
            <button
              type="button"
              className="secondary-button"
              disabled={updatingId === incident.id}
              onClick={() =>
                changeIncidentStatus(
                  incident,
                  "closed"
                )
              }
            >
              Cerrar
            </button>
          )}

          <button
            type="button"
            disabled={updatingId === incident.id}
            onClick={() => startEditing(incident)}
          >
            Editar
          </button>

          <button
            type="button"
            className="danger-button"
            disabled={updatingId === incident.id}
            onClick={() =>
              removeIncident(incident.id)
            }
          >
            Eliminar
          </button>
        </div>
      </article>
    );
  }

  const filteredIncidents = incidents.filter((incident) => {
    const search = filters.search.trim().toLowerCase();

    const matchesSearch =
      !search ||
      incident.title?.toLowerCase().includes(search) ||
      incident.description?.toLowerCase().includes(search);

    const matchesStatus =
      filters.status === "all" ||
      incident.status === filters.status;

    const matchesSeverity =
      filters.severity === "all" ||
      incident.severity === filters.severity;

    const matchesService =
      filters.service === "all" ||
      String(incident.service_id) === filters.service;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSeverity &&
      matchesService
    );
  });

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      search: "",
      status: "all",
      severity: "all",
      service: "all",
    });
  }

  const activeIncidents = incidents.filter(
    (incident) =>
      activeStatuses.has(incident.status)
  );

  const resolvedIncidents = incidents.filter(
    (incident) =>
      !activeStatuses.has(incident.status)
  );

  const visibleActiveIncidents = filteredIncidents.filter(
    (incident) => activeStatuses.has(incident.status)
  );

  const visibleResolvedIncidents = filteredIncidents.filter(
    (incident) => !activeStatuses.has(incident.status)
  );

  const investigatingCount = incidents.filter(
    (incident) => incident.status === "investigating"
  ).length;

  const criticalActiveCount = incidents.filter(
    (incident) =>
      activeStatuses.has(incident.status) &&
      incident.severity === "critical"
  ).length;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">OPERACIONES</p>

          <h1>Incidentes</h1>

          <p className="subtitle">
            Registra, supervisa y gestiona incidencias
            operativas.
          </p>
        </div>
      </header>

      {error && (
        <section className="alert alert--error">
          <strong>Error</strong>
          <span>{error}</span>
        </section>
      )}

      <section className="incident-summary">
        <article className="incident-summary__card">
          <span>Activos</span>
          <strong>{activeIncidents.length}</strong>
          <small>Requieren atención</small>
        </article>

        <article className="incident-summary__card">
          <span>Investigando</span>
          <strong>{investigatingCount}</strong>
          <small>En análisis</small>
        </article>

        <article
          className={
            `incident-summary__card ${
              criticalActiveCount
                ? "incident-summary__card--danger"
                : ""
            }`
          }
        >
          <span>Críticos activos</span>
          <strong>{criticalActiveCount}</strong>
          <small>Prioridad máxima</small>
        </article>

        <article className="incident-summary__card">
          <span>Finalizados</span>
          <strong>{resolvedIncidents.length}</strong>
          <small>Resueltos o cerrados</small>
        </article>
      </section>

      <section className="incident-filters panel">
        <div className="incident-filters__header">
          <div>
            <h2>Filtrar incidentes</h2>
            <span>
              Mostrando {filteredIncidents.length} de {incidents.length}
            </span>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>

        <div className="incident-filters__grid">
          <label>
            Buscar
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Título o descripción"
            />
          </label>

          <label>
            Estado
            <select
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="all">Todos</option>
              <option value="open">Abierto</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>

          <label>
            Severidad
            <select
              name="severity"
              value={filters.severity}
              onChange={updateFilter}
            >
              <option value="all">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </label>

          <label>
            Servicio
            <select
              name="service"
              value={filters.service}
              onChange={updateFilter}
            >
              <option value="all">Todos</option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={String(service.id)}
                >
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="management-grid">
        <form
          className="panel form-panel"
          onSubmit={submitIncident}
        >
          <h2>
            {editingId
              ? "Editar incidente"
              : "Nuevo incidente"}
          </h2>

          <label>
            Título
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Descripción
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows="4"
              required
            />
          </label>

          <label>
            Severidad
            <select
              name="severity"
              value={form.severity}
              onChange={updateField}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </label>

          <label>
            Servicio
            <select
              name="service_id"
              value={form.service_id}
              onChange={updateField}
              required
            >
              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          {editingId && (
            <label>
              Estado
              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                <option value="open">
                  Abierto
                </option>

                <option value="investigating">
                  Investigando
                </option>

                <option value="resolved">
                  Resuelto
                </option>

                <option value="closed">
                  Cerrado
                </option>
              </select>
            </label>
          )}

          <div className="form-actions">
            <button
              className="primary-button"
              disabled={
                saving || !services.length
              }
            >
              {saving
                ? "Guardando..."
                : editingId
                  ? "Guardar cambios"
                  : "Crear incidente"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Incidentes</h2>

              <span>
                {incidents.length} en total
              </span>
            </div>

            <div>
              <span>
                {lastUpdatedAt
                  ? `Actualizado ${lastUpdatedAt.toLocaleTimeString()}`
                  : "Actualizando..."}
              </span>
            </div>
          </div>

          <div className="panel__header">
            <div>
              <h2>Activos</h2>
              <span>
                {activeIncidents.length} pendientes
              </span>
            </div>
          </div>

          <div className="incident-list">
            {visibleActiveIncidents.map(renderIncident)}

            {!visibleActiveIncidents.length && (
              <p className="subtitle">
                No hay incidentes activos.
              </p>
            )}
          </div>

          <div className="panel__header">
            <div>
              <h2>Resueltos</h2>
              <span>
                {resolvedIncidents.length} finalizados
              </span>
            </div>
          </div>

          <div className="incident-list">
            {visibleResolvedIncidents.map(renderIncident)}

            {!visibleResolvedIncidents.length && (
              <p className="subtitle">
                No hay incidentes resueltos.
              </p>
            )}
          </div>
        </section>
      </section>
    </>
  );
}
