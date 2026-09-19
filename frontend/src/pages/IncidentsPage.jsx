import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

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


function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatTime(value) {
  if (!value) {
    return "Esperando datos";
  }

  return value.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


function formatDuration(createdAt, resolvedAt) {
  if (!createdAt) {
    return "—";
  }

  const start = new Date(createdAt);

  const end = resolvedAt
    ? new Date(resolvedAt)
    : new Date();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "—";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((end - start) / 1000),
  );

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor(
      (totalSeconds % 86400) / 3600,
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  if (days > 0) {
    return `${days} d ${hours} h`;
  }

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${totalSeconds} s`;
}


function IncidentKpi({
  label,
  value,
  description,
  tone = "neutral",
}) {
  return (
    <article
      className={`incidents-v2-kpi incidents-v2-kpi--${tone}`}
    >
      <div className="incidents-v2-kpi__top">
        <span>{label}</span>
        <span className="incidents-v2-kpi__dot" />
      </div>

      <strong>{value}</strong>

      <p>{description}</p>
    </article>
  );
}


export default function IncidentsPage() {
  const [incidents, setIncidents] =
    useState([]);

  const [services, setServices] =
    useState([]);

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

  const [updatingId, setUpdatingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] = useState(null);

  const [filters, setFilters] =
    useState({
      search: "",
      status: "all",
      severity: "all",
      service: "all",
    });


  const loadData = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      }

      try {
        const [
          incidentData,
          serviceData,
        ] = await Promise.all([
          api.getIncidents(),
          api.getServices(),
        ]);

        const normalizedIncidents =
          Array.isArray(incidentData)
            ? incidentData
            : [];

        const normalizedServices =
          Array.isArray(serviceData)
            ? serviceData
            : [];

        setIncidents(
          normalizedIncidents,
        );

        setServices(
          normalizedServices,
        );

        setLastUpdatedAt(
          new Date(),
        );

        setError("");

        setForm((current) => {
          if (
            current.service_id ||
            normalizedServices.length === 0
          ) {
            return current;
          }

          return {
            ...current,
            service_id: String(
              normalizedServices[0].id,
            ),
          };
        });
      } catch (requestError) {
        setError(
          requestError.message ||
            "No se pudieron cargar los incidentes.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );


  useEffect(() => {
    loadData();

    const intervalId =
      window.setInterval(
        loadData,
        30000,
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);


  useEffect(() => {
    if (!formOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setFormOpen(false);
        setEditingId(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [formOpen]);


  const serviceMap = useMemo(
    () =>
      new Map(
        services.map((service) => [
          service.id,
          service.name,
        ]),
      ),
    [services],
  );


  const stats = useMemo(() => {
    const active =
      incidents.filter((incident) =>
        activeStatuses.has(
          incident.status,
        ),
      );

    const investigating =
      incidents.filter(
        (incident) =>
          incident.status ===
          "investigating",
      );

    const criticalActive =
      active.filter(
        (incident) =>
          incident.severity ===
          "critical",
      );

    const finalized =
      incidents.filter(
        (incident) =>
          !activeStatuses.has(
            incident.status,
          ),
      );

    return {
      active: active.length,
      investigating:
        investigating.length,
      criticalActive:
        criticalActive.length,
      finalized:
        finalized.length,
    };
  }, [incidents]);


  const filteredIncidents =
    useMemo(() => {
      const search =
        filters.search
          .trim()
          .toLowerCase();

      return [...incidents]
        .filter((incident) => {
          const service =
            serviceMap.get(
              incident.service_id,
            ) || "";

          const matchesSearch =
            !search ||
            incident.title
              ?.toLowerCase()
              .includes(search) ||
            incident.description
              ?.toLowerCase()
              .includes(search) ||
            service
              .toLowerCase()
              .includes(search);

          const matchesStatus =
            filters.status === "all" ||
            incident.status ===
              filters.status;

          const matchesSeverity =
            filters.severity === "all" ||
            incident.severity ===
              filters.severity;

          const matchesService =
            filters.service === "all" ||
            String(
              incident.service_id,
            ) === filters.service;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesSeverity &&
            matchesService
          );
        })
        .sort((a, b) => {
          const aDate =
            new Date(
              a.created_at || 0,
            ).getTime();

          const bDate =
            new Date(
              b.created_at || 0,
            ).getTime();

          return bDate - aDate;
        });
    }, [
      incidents,
      filters,
      serviceMap,
    ]);


  const hasFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.severity !== "all" ||
    filters.service !== "all";


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


  function updateFilter(event) {
    const {
      name,
      value,
    } = event.target;

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


  function openNewIncident() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      service_id: services[0]
        ? String(services[0].id)
        : "",
    });

    setFormOpen(true);
  }


  function startEditing(incident) {
    setEditingId(incident.id);

    setForm({
      title: incident.title,
      description:
        incident.description || "",
      severity:
        incident.severity,
      service_id:
        incident.service_id == null
          ? ""
          : String(
              incident.service_id,
            ),
      status:
        incident.status,
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      service_id: services[0]
        ? String(services[0].id)
        : "",
    });

    setFormOpen(false);
  }


  async function submitIncident(event) {
    event.preventDefault();

    if (
      !form.service_id &&
      !editingId
    ) {
      setError(
        "Selecciona un servicio.",
      );

      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description:
        form.description,
      severity: form.severity,
      service_id:
        form.service_id
          ? Number(
              form.service_id,
            )
          : null,
    };

    try {
      if (editingId) {
        await api.updateIncident(
          editingId,
          {
            ...payload,
            status: form.status,
          },
        );
      } else {
        await api.createIncident(
          payload,
        );
      }

      closeForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo guardar el incidente.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function removeIncident(
    incident,
  ) {
    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar "${incident.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.deleteIncident(
        incident.id,
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo eliminar el incidente.",
      );
    }
  }


  async function changeIncidentStatus(
    incident,
    status,
  ) {
    if (
      updatingId === incident.id
    ) {
      return;
    }

    setUpdatingId(
      incident.id,
    );

    setError("");

    try {
      await api.changeIncidentStatus(
        incident.id,
        status,
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          "No se pudo cambiar el estado.",
      );
    } finally {
      setUpdatingId(null);
    }
  }


  return (
    <section className="incidents-v2">
      <header className="topbar incidents-v2__topbar">
        <div>
          <p className="eyebrow">
            INCIDENT MANAGEMENT
          </p>

          <h1>Incidentes</h1>

          <p className="subtitle">
            Detección, investigación y
            resolución de incidencias
            operativas.
          </p>
        </div>

        <div className="incidents-v2__header-actions">
          <span className="incidents-v2__updated">
            {lastUpdatedAt
              ? `Actualizado ${formatTime(
                  lastUpdatedAt,
                )}`
              : "Esperando datos"}
          </span>

          <button
            type="button"
            className="secondary-button"
            disabled={refreshing}
            onClick={() =>
              loadData({
                refresh: true,
              })
            }
          >
            {refreshing
              ? "Actualizando..."
              : "Actualizar"}
          </button>

          <button
            type="button"
            className="primary-button incidents-v2__new-button"
            onClick={() => {
              if (formOpen) {
                closeForm();
              } else {
                openNewIncident();
              }
            }}
          >
            {formOpen ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="m9 9 6 6" />
                <path d="m15 9-6 6" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7 3h8l4 4v14H7z" />
                <path d="M15 3v5h5" />
                <path d="M13 11v6" />
                <path d="M10 14h6" />
              </svg>
            )}

            {formOpen
              ? editingId
                ? "Cancelar edición"
                : "Cancelar creación"
              : "Nuevo incidente"}
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


      <section className="incidents-v2-kpis">
        <IncidentKpi
          label="Activos"
          value={
            loading
              ? "—"
              : stats.active
          }
          description="Requieren atención"
          tone={
            stats.active > 0
              ? "warning"
              : "success"
          }
        />

        <IncidentKpi
          label="Investigando"
          value={
            loading
              ? "—"
              : stats.investigating
          }
          description="Actualmente en análisis"
          tone={
            stats.investigating > 0
              ? "warning"
              : "neutral"
          }
        />

        <IncidentKpi
          label="Críticos activos"
          value={
            loading
              ? "—"
              : stats.criticalActive
          }
          description="Prioridad máxima"
          tone={
            stats.criticalActive > 0
              ? "danger"
              : "success"
          }
        />

        <IncidentKpi
          label="Finalizados"
          value={
            loading
              ? "—"
              : stats.finalized
          }
          description="Resueltos o cerrados"
          tone="success"
        />
      </section>


      {formOpen && (
        <div className="incidents-v2-modal-backdrop">
          <section
            className="incidents-v2-form-panel incidents-v2-form-panel--modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-form-title"
          >
          <div className="incidents-v2-form-panel__header">
            <div>
              <span>
                {editingId
                  ? "EDICIÓN"
                  : "NUEVA INCIDENCIA"}
              </span>

              <h2 id="incident-form-title">
                {editingId
                  ? "Editar incidente"
                  : "Nuevo incidente"}
              </h2>

              <p>
                {editingId
                  ? "Actualiza la información y el estado del incidente."
                  : "Registra una incidencia vinculada a uno de los servicios monitorizados."}
              </p>
            </div>

            <button
              type="button"
              className="incidents-v2-form-panel__close"
              aria-label="Cerrar formulario"
              onClick={closeForm}
            >
              ×
            </button>
          </div>

          <form
            className="incidents-v2-form"
            onSubmit={submitIncident}
          >
            <label className="incidents-v2-form__title">
              <span>Título</span>

              <input
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Caída del backend principal"
                autoFocus
                required
              />
            </label>

            <label>
              <span>Severidad</span>

              <select
                name="severity"
                value={form.severity}
                onChange={updateField}
              >
                <option value="low">
                  Baja
                </option>

                <option value="medium">
                  Media
                </option>

                <option value="high">
                  Alta
                </option>

                <option value="critical">
                  Crítica
                </option>
              </select>
            </label>

            <label>
              <span>Servicio afectado</span>

              <select
                name="service_id"
                value={form.service_id}
                onChange={updateField}
                required={!editingId}
              >
                <option value="">
                  Sin asignar
                </option>

                {services.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={String(
                        service.id,
                      )}
                    >
                      {service.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            {editingId && (
              <label>
                <span>Estado</span>

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

            <label className="incidents-v2-form__description">
              <span>Descripción</span>

              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows={4}
                placeholder="Describe el impacto, síntomas y contexto observado..."
                required
              />
            </label>

            <div className="incidents-v2-form__actions">
              <button
                type="button"
                className="secondary-button incidents-v2-form__cancel"
                onClick={closeForm}
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
                    : "Crear incidente"}
              </button>
            </div>
          </form>
          </section>
        </div>
      )}


      <section className="incidents-v2-filters">
        <div className="incidents-v2-filters__heading">
          <div>
            <span>FILTROS</span>

            <strong>
              {filteredIncidents.length}
              {" / "}
              {incidents.length}
            </strong>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="incidents-v2-filters__grid">
          <label className="incidents-v2-filters__search">
            <span>Buscar</span>

            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Título, descripción o servicio..."
            />
          </label>

          <label>
            <span>Estado</span>

            <select
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="all">
                Todos
              </option>

              <option value="open">
                Abiertos
              </option>

              <option value="investigating">
                Investigando
              </option>

              <option value="resolved">
                Resueltos
              </option>

              <option value="closed">
                Cerrados
              </option>
            </select>
          </label>

          <label>
            <span>Severidad</span>

            <select
              name="severity"
              value={filters.severity}
              onChange={updateFilter}
            >
              <option value="all">
                Todas
              </option>

              <option value="low">
                Baja
              </option>

              <option value="medium">
                Media
              </option>

              <option value="high">
                Alta
              </option>

              <option value="critical">
                Crítica
              </option>
            </select>
          </label>

          <label>
            <span>Servicio</span>

            <select
              name="service"
              value={filters.service}
              onChange={updateFilter}
            >
              <option value="all">
                Todos
              </option>

              {services.map(
                (service) => (
                  <option
                    key={service.id}
                    value={String(
                      service.id,
                    )}
                  >
                    {service.name}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>


      <section className="incidents-v2-inventory">
        <div className="incidents-v2-inventory__header">
          <div>
            <span>
              COLA OPERATIVA
            </span>

            <h2>
              Incidentes registrados
            </h2>

            <p>
              Seguimiento y resolución de
              incidencias de la plataforma.
            </p>
          </div>

          <div className="incidents-v2-inventory__count">
            <strong>
              {filteredIncidents.length}
            </strong>

            <span>
              visibles
            </span>
          </div>
        </div>


        {loading &&
          incidents.length === 0 && (
            <div className="incidents-v2-empty">
              Cargando incidentes...
            </div>
          )}


        {!loading &&
          filteredIncidents.length === 0 && (
            <div className="incidents-v2-empty">
              <div className="incidents-v2-empty__icon">
                ✓
              </div>

              <strong>
                {hasFilters
                  ? "No hay coincidencias"
                  : "Sin incidentes registrados"}
              </strong>

              <p>
                {hasFilters
                  ? "Prueba a modificar o limpiar los filtros."
                  : "No hay incidencias que requieran seguimiento."}
              </p>
            </div>
          )}


        {filteredIncidents.length > 0 && (
          <div className="incidents-v2-list">
            <div className="incidents-v2-row incidents-v2-row--header">
              <span>Incidente</span>
              <span>Estado</span>
              <span>Servicio</span>
              <span>Duración</span>
              <span>Creado</span>
              <span>Acciones</span>
            </div>

            {filteredIncidents.map(
              (incident) => {
                const busy =
                  updatingId ===
                  incident.id;

                const active =
                  activeStatuses.has(
                    incident.status,
                  );

                return (
                  <article
                    key={incident.id}
                    className={`incidents-v2-row ${
                      active
                        ? "incidents-v2-row--active"
                        : "incidents-v2-row--finalized"
                    }`}
                  >
                    <div className="incidents-v2-incident">
                      <span
                        className={`incidents-v2-severity-dot incidents-v2-severity-dot--${incident.severity}`}
                      />

                      <div>
                        <div className="incidents-v2-incident__badges">
                          <span
                            className={`incidents-v2-severity incidents-v2-severity--${incident.severity}`}
                          >
                            {severityLabels[
                              incident.severity
                            ] ||
                              incident.severity}
                          </span>

                          <span className="incidents-v2-incident__id">
                            #{incident.id}
                          </span>
                        </div>

                        <Link
                          to={`/incidentes/${incident.id}`}
                          className="incidents-v2-incident__title"
                        >
                          {incident.title}
                        </Link>

                        <p>
                          {incident.description ||
                            "Sin descripción"}
                        </p>
                      </div>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label="Estado"
                    >
                      <span
                        className={`incidents-v2-status incidents-v2-status--${incident.status}`}
                      >
                        <span />

                        {statusLabels[
                          incident.status
                        ] ||
                          incident.status}
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label="Servicio"
                    >
                      <strong>
                        {serviceMap.get(
                          incident.service_id,
                        ) ||
                          "Sin asignar"}
                      </strong>

                      <span>
                        Servicio afectado
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label="Duración"
                    >
                      <strong>
                        {formatDuration(
                          incident.created_at,
                          incident.resolved_at,
                        )}
                      </strong>

                      <span>
                        {incident.resolved_at
                          ? "Finalizado"
                          : "En curso"}
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label="Creado"
                    >
                      <strong>
                        {formatDateTime(
                          incident.created_at,
                        )}
                      </strong>

                      <span>
                        {incident.resolved_at
                          ? `Resuelto ${formatDateTime(
                              incident.resolved_at,
                            )}`
                          : "Sin resolución"}
                      </span>
                    </div>


                    <div className="incidents-v2-row__actions">
                      <Link
                        to={`/incidentes/${incident.id}`}
                        className="incidents-v2-action incidents-v2-action--primary"
                      >
                        Detalle
                      </Link>

                      {incident.status ===
                        "open" && (
                        <button
                          type="button"
                          className="incidents-v2-action"
                          disabled={busy}
                          onClick={() =>
                            changeIncidentStatus(
                              incident,
                              "investigating",
                            )
                          }
                        >
                          Investigar
                        </button>
                      )}

                      {active && (
                        <button
                          type="button"
                          className="incidents-v2-action incidents-v2-action--resolve"
                          disabled={busy}
                          onClick={() =>
                            changeIncidentStatus(
                              incident,
                              "resolved",
                            )
                          }
                        >
                          Resolver
                        </button>
                      )}

                      {incident.status ===
                        "resolved" && (
                        <button
                          type="button"
                          className="incidents-v2-action"
                          disabled={busy}
                          onClick={() =>
                            changeIncidentStatus(
                              incident,
                              "closed",
                            )
                          }
                        >
                          Cerrar
                        </button>
                      )}

                      <button
                        type="button"
                        className="incidents-v2-action"
                        disabled={busy}
                        onClick={() =>
                          startEditing(
                            incident,
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="incidents-v2-action incidents-v2-action--danger"
                        disabled={busy}
                        onClick={() =>
                          removeIncident(
                            incident,
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </section>
  );
}
