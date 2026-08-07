import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const emptyForm = {
  title: "",
  description: "",
  severity: "medium",
  service_id: "",
  status: "open",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [incidentData, serviceData] = await Promise.all([
        api.getIncidents(),
        api.getServices(),
      ]);

      setIncidents(incidentData);
      setServices(serviceData);

      if (!form.service_id && serviceData.length) {
        setForm((current) => ({
          ...current,
          service_id: String(serviceData[0].id),
        }));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [form.service_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
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
      service_id: services[0] ? String(services[0].id) : "",
    });
  }

  async function submitIncident(event) {
    event.preventDefault();

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
    }
  }

  async function removeIncident(id) {
    if (!window.confirm("¿Eliminar este incidente?")) {
      return;
    }

    try {
      await api.deleteIncident(id);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function serviceName(id) {
    return services.find((service) => service.id === id)?.name || `#${id}`;
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">OPERACIONES</p>
          <h1>Incidentes</h1>
          <p className="subtitle">
            Registra y gestiona incidencias operativas.
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
        <form className="panel form-panel" onSubmit={submitIncident}>
          <h2>
            {editingId ? "Editar incidente" : "Nuevo incidente"}
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
                <option key={service.id} value={service.id}>
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
                <option value="open">Abierto</option>
                <option value="investigating">Investigando</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </label>
          )}

          <div className="form-actions">
            <button
              className="primary-button"
              disabled={!services.length}
            >
              {editingId ? "Guardar cambios" : "Crear incidente"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="panel table-panel">
          <div className="panel__header">
            <h2>Historial de incidentes</h2>
            <span>{incidents.length} incidentes</span>
          </div>

          <div className="incident-list">
            {incidents.map((incident) => (
              <article className="incident-card" key={incident.id}>
                <div>
                  <span
                    className={`severity-badge severity-badge--${incident.severity}`}
                  >
                    {incident.severity}
                  </span>

                  <span className="status-badge">
                    {incident.status}
                  </span>
                </div>

                <h3>{incident.title}</h3>
                <p>{incident.description}</p>

                <small>
                  Servicio: {serviceName(incident.service_id)}
                </small>

                <div className="table-actions">
                  <button onClick={() => startEditing(incident)}>
                    Editar
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => removeIncident(incident.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
