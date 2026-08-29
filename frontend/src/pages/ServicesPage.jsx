import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const emptyForm = {
  name: "",
  type: "api",
  endpoint: "",
  status: "unknown",
};

const statusLabels = {
  up: "Operativo",
  down: "Caído",
  unknown: "Desconocido",
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [uptimeByService, setUptimeByService] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const loadServices = useCallback(async () => {
    try {
      const serviceData = await api.getServices();

      const uptimeEntries = await Promise.all(
        serviceData.map(async (service) => {
          try {
            const uptime = await api.getServiceUptime(
              service.id,
              1
            );

            return [service.id, uptime];
          } catch {
            return [service.id, null];
          }
        })
      );

      setServices(serviceData);
      setUptimeByService(
        Object.fromEntries(uptimeEntries)
      );
      setLastUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    loadServices();

    const intervalId = window.setInterval(() => {
      loadServices();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadServices]);

  async function checkServicesNow() {
    if (checking) {
      return;
    }

    setChecking(true);
    setError("");

    try {
      const execution = await api.runServiceHealthCheck();

      setLastCheckedAt(
        execution.result?.checked_at
          ? new Date(execution.result.checked_at)
          : new Date()
      );

      await loadServices();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setChecking(false);
    }
  }

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function startEditing(service) {
    setEditingId(service.id);

    setForm({
      name: service.name,
      type: service.type,
      endpoint: service.endpoint,
      status: service.status,
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitService(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.updateService(editingId, form);
      } else {
        await api.createService({
          name: form.name,
          type: form.type,
          endpoint: form.endpoint,
        });
      }

      cancelEditing();
      await loadServices();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeService(id) {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este servicio?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.deleteService(id);
      await loadServices();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">INVENTARIO</p>

          <h1>Servicios</h1>

          <p className="subtitle">
            Gestiona y supervisa los componentes monitorizados.
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
          onSubmit={submitService}
        >
          <h2>
            {editingId
              ? "Editar servicio"
              : "Nuevo servicio"}
          </h2>

          <label>
            Nombre
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Tipo
            <select
              name="type"
              value={form.type}
              onChange={updateField}
            >
              <option value="api">API</option>
              <option value="database">
                Base de datos
              </option>
              <option value="frontend">
                Frontend
              </option>
              <option value="monitoring">
                Monitorización
              </option>
              <option value="other">
                Otro
              </option>
            </select>
          </label>

          <label>
            Endpoint
            <input
              name="endpoint"
              value={form.endpoint}
              onChange={updateField}
              placeholder="http://servicio:puerto"
              required
            />
          </label>

          {editingId && (
            <label>
              Estado
              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                <option value="unknown">
                  Desconocido
                </option>
                <option value="up">
                  Operativo
                </option>
                <option value="down">
                  Caído
                </option>
              </select>
            </label>
          )}

          <div className="form-actions">
            <button
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : editingId
                  ? "Guardar cambios"
                  : "Crear servicio"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEditing}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Servicios registrados</h2>

              <span>
                {services.length} servicios
              </span>
            </div>

            <div className="table-actions">
              <span>
                {lastUpdatedAt
                  ? `Actualizado ${lastUpdatedAt.toLocaleTimeString()}`
                  : "Actualizando..."}
              </span>

              <button
                type="button"
                className="secondary-button"
                onClick={checkServicesNow}
                disabled={checking}
              >
                {checking
                  ? "Comprobando..."
                  : "Comprobar ahora"}
              </button>
            </div>
          </div>

          {lastCheckedAt && (
            <p className="subtitle">
              Última comprobación manual:{" "}
              {lastCheckedAt.toLocaleTimeString()}
            </p>
          )}

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Uptime 1 h</th>
                  <th>Latencia media</th>
                  <th>Último check</th>
                  <th>Endpoint</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => {
                  const uptime =
                    uptimeByService[service.id];

                  return (
                  <tr key={service.id}>
                    <td>{service.name}</td>

                    <td>{service.type}</td>

                    <td>
                      <span
                        className={
                          `status-badge ` +
                          `status-badge--${service.status}`
                        }
                      >
                        {statusLabels[service.status] ||
                          service.status}
                      </span>
                    </td>

                    <td>
                      {uptime?.uptime_percent != null ? (
                        <span
                          className={
                            `uptime-value ` +
                            `${
                              uptime.uptime_percent >= 99
                                ? "uptime-value--good"
                                : uptime.uptime_percent >= 95
                                  ? "uptime-value--warning"
                                  : "uptime-value--danger"
                            }`
                          }
                        >
                          {uptime.uptime_percent.toFixed(2)} %
                        </span>
                      ) : (
                        <span className="metric-empty">—</span>
                      )}
                    </td>

                    <td>
                      {uptime?.average_response_time_ms != null
                        ? `${uptime.average_response_time_ms.toFixed(1)} ms`
                        : "—"}
                    </td>

                    <td>
                      {uptime?.last_checked_at
                        ? new Date(
                            uptime.last_checked_at
                          ).toLocaleTimeString()
                        : "Sin datos"}
                    </td>

                    <td className="endpoint-cell">
                      {service.endpoint}
                    </td>

                    <td className="table-actions">
                      <Link
                        className="table-link-button"
                        to={`/servicios/${service.id}`}
                      >
                        Detalle
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(service)
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          removeService(service.id)
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  );
                })}

                {!services.length && (
                  <tr>
                    <td colSpan="8">
                      No hay servicios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </>
  );
}
