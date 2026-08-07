import { useCallback, useEffect, useState } from "react";
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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      setError("");
      setServices(await api.getServices());
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

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
            Gestiona los componentes monitorizados.
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
        <form className="panel form-panel" onSubmit={submitService}>
          <h2>
            {editingId ? "Editar servicio" : "Nuevo servicio"}
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
              <option value="database">Base de datos</option>
              <option value="frontend">Frontend</option>
              <option value="monitoring">Monitorización</option>
              <option value="other">Otro</option>
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
                <option value="unknown">Desconocido</option>
                <option value="up">Operativo</option>
                <option value="down">Caído</option>
              </select>
            </label>
          )}

          <div className="form-actions">
            <button className="primary-button" disabled={saving}>
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
            <h2>Servicios registrados</h2>
            <span>{services.length} servicios</span>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Endpoint</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{service.type}</td>
                    <td>
                      <span
                        className={`status-badge status-badge--${service.status}`}
                      >
                        {statusLabels[service.status] || service.status}
                      </span>
                    </td>
                    <td className="endpoint-cell">
                      {service.endpoint}
                    </td>
                    <td className="table-actions">
                      <button onClick={() => startEditing(service)}>
                        Editar
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => removeService(service.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {!services.length && (
                  <tr>
                    <td colSpan="5">No hay servicios registrados.</td>
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
