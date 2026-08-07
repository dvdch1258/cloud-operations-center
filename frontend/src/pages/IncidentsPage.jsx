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
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

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

        <div className="table-actions">
          <button
            type="button"
            onClick={() => startEditing(incident)}
          >
            Editar
          </button>

          <button
            type="button"
            className="danger-button"
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

  const activeIncidents = incidents.filter(
    (incident) =>
      activeStatuses.has(incident.status)
  );

  const resolvedIncidents = incidents.filter(
    (incident) =>
      !activeStatuses.has(incident.status)
  );

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
            {activeIncidents.map(renderIncident)}

            {!activeIncidents.length && (
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
            {resolvedIncidents.map(renderIncident)}

            {!resolvedIncidents.length && (
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
