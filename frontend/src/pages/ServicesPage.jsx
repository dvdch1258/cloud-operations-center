import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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


const typeLabels = {
  api: "API",
  database: "Base de datos",
  frontend: "Frontend",
  monitoring: "Monitorización",
  other: "Otro",
};


function formatTime(value) {
  if (!value) {
    return "Sin datos";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin datos";
  }

  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


function uptimeTone(value) {
  if (value == null) {
    return "unknown";
  }

  if (value >= 99) {
    return "good";
  }

  if (value >= 95) {
    return "warning";
  }

  return "danger";
}


function ServicesKpi({
  label,
  value,
  description,
  tone = "neutral",
}) {
  return (
    <article
      className={`services-v2-kpi services-v2-kpi--${tone}`}
    >
      <div className="services-v2-kpi__top">
        <span>{label}</span>
        <span className="services-v2-kpi__dot" />
      </div>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  );
}


export default function ServicesPage() {
  const [services, setServices] =
    useState([]);

  const [
    uptimeByService,
    setUptimeByService,
  ] = useState({});

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [checking, setChecking] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] = useState(null);

  const [
    lastCheckedAt,
    setLastCheckedAt,
  ] = useState(null);


  const loadServices = useCallback(async () => {
    try {
      const serviceData =
        await api.getServices();

      const normalizedServices =
        Array.isArray(serviceData)
          ? serviceData
          : [];

      const uptimeEntries =
        await Promise.all(
          normalizedServices.map(
            async (service) => {
              try {
                const uptime =
                  await api.getServiceUptime(
                    service.id,
                    1,
                  );

                return [
                  service.id,
                  uptime,
                ];
              } catch {
                return [
                  service.id,
                  null,
                ];
              }
            },
          ),
        );

      setServices(normalizedServices);

      setUptimeByService(
        Object.fromEntries(
          uptimeEntries,
        ),
      );

      setLastUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudieron cargar los servicios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadServices();

    const intervalId =
      window.setInterval(
        loadServices,
        30000,
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadServices]);


  const stats = useMemo(() => {
    const total = services.length;

    const up = services.filter(
      (service) =>
        service.status === "up",
    ).length;

    const down = services.filter(
      (service) =>
        service.status === "down",
    ).length;

    const knownUptimes =
      services
        .map(
          (service) =>
            uptimeByService[service.id]
              ?.uptime_percent,
        )
        .filter(
          (value) =>
            value != null &&
            Number.isFinite(
              Number(value),
            ),
        )
        .map(Number);

    const averageUptime =
      knownUptimes.length > 0
        ? knownUptimes.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) / knownUptimes.length
        : null;

    return {
      total,
      up,
      down,
      unknown:
        total - up - down,
      averageUptime,
    };
  }, [
    services,
    uptimeByService,
  ]);


  async function checkServicesNow() {
    if (checking) {
      return;
    }

    setChecking(true);
    setError("");

    try {
      const execution =
        await api.runServiceHealthCheck();

      setLastCheckedAt(
        execution.result?.checked_at
          ? new Date(
              execution.result.checked_at,
            )
          : new Date(),
      );

      await loadServices();
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo ejecutar la comprobación.",
      );
    } finally {
      setChecking(false);
    }
  }


  function updateField(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  function openNewService() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }


  function startEditing(service) {
    setEditingId(service.id);

    setForm({
      name: service.name,
      type: service.type,
      endpoint: service.endpoint,
      status: service.status,
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  }


  async function submitService(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.updateService(
          editingId,
          form,
        );
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
      setError(
        requestError.message ||
          "No se pudo guardar el servicio.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function removeService(id) {
    const service =
      services.find(
        (item) => item.id === id,
      );

    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar ${
          service?.name
            ? `"${service.name}"`
            : "este servicio"
        }?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.deleteService(id);
      await loadServices();
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo eliminar el servicio.",
      );
    }
  }


  return (
    <section className="services-v2">
      <header className="topbar services-v2__topbar">
        <div>
          <p className="eyebrow">
            SERVICE INVENTORY
          </p>

          <h1>Servicios</h1>

          <p className="subtitle">
            Inventario, disponibilidad y
            monitorización de los componentes
            de la plataforma.
          </p>
        </div>

        <div className="services-v2__header-actions">
          <div className="services-v2__update-copy">
            <span>
              {lastUpdatedAt
                ? `Actualizado ${formatTime(
                    lastUpdatedAt,
                  )}`
                : "Esperando datos"}
            </span>

            {lastCheckedAt && (
              <small>
                Check manual{" "}
                {formatTime(lastCheckedAt)}
              </small>
            )}
          </div>

          <button
            type="button"
            className="secondary-button services-v2__check-button"
            disabled={checking}
            onClick={checkServicesNow}
          >
            <span className="services-v2__button-icon">
              ↻
            </span>

            {checking
              ? "Comprobando..."
              : "Comprobar ahora"}
          </button>

          <button
            type="button"
            className="primary-button services-v2__new-button"
            onClick={() => {
              if (
                formOpen &&
                !editingId
              ) {
                cancelEditing();
              } else {
                openNewService();
              }
            }}
          >
            <span className="services-v2__button-icon">
              +
            </span>

            {formOpen && !editingId
              ? "Cerrar formulario"
              : "Nuevo servicio"}
          </button>
        </div>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            No se pudo completar la operación
          </strong>

          <span>{error}</span>
        </section>
      )}


      <section className="services-v2-kpis">
        <ServicesKpi
          label="Servicios"
          value={
            loading
              ? "—"
              : stats.total
          }
          description="Componentes registrados"
        />

        <ServicesKpi
          label="Operativos"
          value={
            loading
              ? "—"
              : stats.up
          }
          description={
            stats.total > 0
              ? `${Math.round(
                  (stats.up /
                    stats.total) *
                    100,
                )}% del inventario`
              : "Sin servicios registrados"
          }
          tone="success"
        />

        <ServicesKpi
          label="Caídos"
          value={
            loading
              ? "—"
              : stats.down
          }
          description={
            stats.down > 0
              ? "Requieren atención"
              : "Sin interrupciones"
          }
          tone={
            stats.down > 0
              ? "danger"
              : "success"
          }
        />

        <ServicesKpi
          label="Uptime medio · 1h"
          value={
            loading
              ? "—"
              : stats.averageUptime != null
                ? `${stats.averageUptime.toFixed(
                    2,
                  )}%`
                : "—"
          }
          description={
            stats.unknown > 0
              ? `${stats.unknown} con estado desconocido`
              : "Disponibilidad monitorizada"
          }
          tone={
            stats.averageUptime == null
              ? "neutral"
              : stats.averageUptime >= 99
                ? "success"
                : stats.averageUptime >= 95
                  ? "warning"
                  : "danger"
          }
        />
      </section>


      {formOpen && (
        <section className="services-v2-form-panel">
          <div className="services-v2-form-panel__header">
            <div>
              <span>
                {editingId
                  ? "EDICIÓN"
                  : "ALTA DE SERVICIO"}
              </span>

              <h2>
                {editingId
                  ? "Editar servicio"
                  : "Nuevo servicio"}
              </h2>

              <p>
                {editingId
                  ? "Actualiza la configuración del componente monitorizado."
                  : "Registra un nuevo endpoint para incorporarlo a la monitorización."}
              </p>
            </div>

            <button
              type="button"
              className="services-v2-form-panel__close"
              aria-label="Cerrar formulario"
              onClick={cancelEditing}
            >
              ×
            </button>
          </div>

          <form
            className="services-v2-form"
            onSubmit={submitService}
          >
            <label>
              <span>Nombre</span>

              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Backend API"
                required
              />
            </label>

            <label>
              <span>Tipo</span>

              <select
                name="type"
                value={form.type}
                onChange={updateField}
              >
                <option value="api">
                  API
                </option>

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

            <label className="services-v2-form__endpoint">
              <span>Endpoint</span>

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
                <span>Estado</span>

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

            <div className="services-v2-form__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEditing}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear servicio"}
              </button>
            </div>
          </form>
        </section>
      )}


      <section className="services-v2-inventory">
        <div className="services-v2-inventory__header">
          <div>
            <span>
              INVENTARIO MONITORIZADO
            </span>

            <h2>
              Servicios registrados
            </h2>

            <p>
              Estado, disponibilidad y
              telemetría de cada componente.
            </p>
          </div>

          <div className="services-v2-inventory__count">
            <strong>
              {services.length}
            </strong>

            <span>
              {services.length === 1
                ? "servicio"
                : "servicios"}
            </span>
          </div>
        </div>


        {loading && services.length === 0 && (
          <div className="services-v2-loading">
            Cargando servicios...
          </div>
        )}


        {!loading &&
          services.length === 0 && (
            <div className="services-v2-empty">
              <div className="services-v2-empty__icon">
                +
              </div>

              <div>
                <strong>
                  No hay servicios registrados
                </strong>

                <p>
                  Añade el primer componente
                  para comenzar a monitorizarlo.
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={openNewService}
              >
                Nuevo servicio
              </button>
            </div>
          )}


        {services.length > 0 && (
          <div className="services-v2-list">
            <div className="services-v2-row services-v2-row--header">
              <span>Servicio</span>
              <span>Estado</span>
              <span>Uptime · 1h</span>
              <span>Latencia</span>
              <span>Último check</span>
              <span>Acciones</span>
            </div>

            {services.map((service) => {
              const uptime =
                uptimeByService[
                  service.id
                ];

              const uptimePercent =
                uptime?.uptime_percent;

              const latency =
                uptime
                  ?.average_response_time_ms;

              const tone =
                uptimeTone(
                  uptimePercent,
                );

              return (
                <article
                  className="services-v2-row"
                  key={service.id}
                >
                  <div className="services-v2-service">
                    <span
                      className={`services-v2-service__status services-v2-service__status--${service.status}`}
                    />

                    <div>
                      <Link
                        to={`/servicios/${service.id}`}
                        className="services-v2-service__name"
                      >
                        {service.name}
                      </Link>

                      <div className="services-v2-service__meta">
                        <span>
                          {typeLabels[
                            service.type
                          ] ||
                            service.type}
                        </span>

                        <span>
                          #{service.id}
                        </span>
                      </div>

                      <span className="services-v2-service__endpoint">
                        {service.endpoint}
                      </span>
                    </div>
                  </div>


                  <div
                    className="services-v2-row__metric"
                    data-label="Estado"
                  >
                    <span
                      className={`services-v2-status services-v2-status--${service.status}`}
                    >
                      <span />

                      {statusLabels[
                        service.status
                      ] ||
                        service.status}
                    </span>
                  </div>


                  <div
                    className="services-v2-row__metric"
                    data-label="Uptime · 1h"
                  >
                    <strong
                      className={`services-v2-uptime services-v2-uptime--${tone}`}
                    >
                      {uptimePercent != null
                        ? `${Number(
                            uptimePercent,
                          ).toFixed(
                            2,
                          )}%`
                        : "—"}
                    </strong>

                    <div className="services-v2-uptime-bar">
                      <span
                        className={`services-v2-uptime-bar__fill services-v2-uptime-bar__fill--${tone}`}
                        style={{
                          width:
                            uptimePercent !=
                            null
                              ? `${Math.min(
                                  Math.max(
                                    Number(
                                      uptimePercent,
                                    ),
                                    0,
                                  ),
                                  100,
                                )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>


                  <div
                    className="services-v2-row__metric"
                    data-label="Latencia"
                  >
                    <strong>
                      {latency != null
                        ? `${Number(
                            latency,
                          ).toFixed(
                            1,
                          )} ms`
                        : "—"}
                    </strong>

                    <span>
                      Media última hora
                    </span>
                  </div>


                  <div
                    className="services-v2-row__metric"
                    data-label="Último check"
                  >
                    <strong>
                      {formatTime(
                        uptime
                          ?.last_checked_at,
                      )}
                    </strong>

                    <span>
                      Monitorización
                    </span>
                  </div>


                  <div className="services-v2-row__actions">
                    <Link
                      className="services-v2-action services-v2-action--primary"
                      to={`/servicios/${service.id}`}
                    >
                      Detalle
                    </Link>

                    <button
                      type="button"
                      className="services-v2-action"
                      onClick={() =>
                        startEditing(
                          service,
                        )
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="services-v2-action services-v2-action--danger"
                      onClick={() =>
                        removeService(
                          service.id,
                        )
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
