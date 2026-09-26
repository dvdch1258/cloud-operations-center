import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";


const emptyForm = {
  title: "",
  description: "",
  severity: "medium",
  service_id: "",
  status: "open",
};


function severityLabel(severity, t) {
  const known = new Set([
    "low",
    "medium",
    "high",
    "critical",
  ]);

  return known.has(severity)
    ? t(`incidents.severity.${severity}`)
    : severity;
}


function statusLabel(status, t) {
  const known = new Set([
    "open",
    "investigating",
    "resolved",
    "closed",
  ]);

  return known.has(status)
    ? t(`incidents.status.${status}`)
    : status;
}


function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


const activeStatuses = new Set([
  "open",
  "investigating",
]);


function formatDateTime(value, language) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    localeForLanguage(language),
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function formatTime(value, language) {
  if (!value) {
    return "—";
  }

  return value.toLocaleTimeString(
    localeForLanguage(language),
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
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
  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage ||
    i18n.language;

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
            t("incidents.errors.load"),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
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
        t("incidents.errors.selectService"),
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
          t("incidents.errors.save"),
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
        t("incidents.confirmDelete", {
          title: incident.title,
        }),
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
          t("incidents.errors.delete"),
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
          t("incidents.errors.changeStatus"),
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
            {t("incidents.eyebrow")}
          </p>

          <h1>{t("incidents.title")}</h1>

          <p className="subtitle">
            {t("incidents.subtitle")}
          </p>
        </div>

        <div className="incidents-v2__header-actions">
          <span className="incidents-v2__updated">
            {lastUpdatedAt
              ? t("incidents.updated", {
                  time: formatTime(
                    lastUpdatedAt,
                    language,
                  ),
                })
              : t("incidents.waitingForData")}
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
              ? t("common.refreshing")
              : t("common.refresh")}
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
                ? t("incidents.headerActions.cancelEdit")
                : t("incidents.headerActions.cancelCreate")
              : t("incidents.headerActions.newIncident")}
          </button>
        </div>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            {t("incidents.refreshError")}
          </strong>

          <span>{error}</span>

          <div className="v2-error-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading || refreshing}
              onClick={() =>
                loadData({
                  refresh: true,
                })
              }
            >
              {t("incidents.retry")}
            </button>
          </div>
        </section>
      )}


      <section className="incidents-v2-kpis">
        <IncidentKpi
          label={t("incidents.kpi.active")}
          value={
            loading
              ? "—"
              : stats.active
          }
          description={t("incidents.kpi.activeDescription")}
          tone={
            stats.active > 0
              ? "warning"
              : "success"
          }
        />

        <IncidentKpi
          label={t("incidents.kpi.investigating")}
          value={
            loading
              ? "—"
              : stats.investigating
          }
          description={t("incidents.kpi.investigatingDescription")}
          tone={
            stats.investigating > 0
              ? "warning"
              : "neutral"
          }
        />

        <IncidentKpi
          label={t("incidents.kpi.critical")}
          value={
            loading
              ? "—"
              : stats.criticalActive
          }
          description={t("incidents.kpi.criticalDescription")}
          tone={
            stats.criticalActive > 0
              ? "danger"
              : "success"
          }
        />

        <IncidentKpi
          label={t("incidents.kpi.finalized")}
          value={
            loading
              ? "—"
              : stats.finalized
          }
          description={t("incidents.kpi.finalizedDescription")}
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
                  ? t("incidents.form.editEyebrow")
                  : t("incidents.form.createEyebrow")}
              </span>

              <h2 id="incident-form-title">
                {editingId
                  ? t("incidents.form.editTitle")
                  : t("incidents.form.createTitle")}
              </h2>

              <p>
                {editingId
                  ? t("incidents.form.editDescription")
                  : t("incidents.form.createDescription")}
              </p>
            </div>

            <button
              type="button"
              className="incidents-v2-form-panel__close"
              aria-label={t("incidents.form.close")}
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
              <span>{t("incidents.form.title")}</span>

              <input
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder={t("incidents.form.titlePlaceholder")}
                autoFocus
                required
              />
            </label>

            <label>
              <span>{t("incidents.form.severity")}</span>

              <select
                name="severity"
                value={form.severity}
                onChange={updateField}
              >
                <option value="low">
                  {t("incidents.severity.low")}
                </option>

                <option value="medium">
                  {t("incidents.severity.medium")}
                </option>

                <option value="high">
                  {t("incidents.severity.high")}
                </option>

                <option value="critical">
                  {t("incidents.severity.critical")}
                </option>
              </select>
            </label>

            <label>
              <span>{t("incidents.form.service")}</span>

              <select
                name="service_id"
                value={form.service_id}
                onChange={updateField}
                required={!editingId}
              >
                <option value="">
                  {t("incidents.form.unassigned")}
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
                <span>{t("incidents.form.status")}</span>

                <select
                  name="status"
                  value={form.status}
                  onChange={updateField}
                >
                  <option value="open">
                    {t("incidents.status.open")}
                  </option>

                  <option value="investigating">
                    {t("incidents.status.investigating")}
                  </option>

                  <option value="resolved">
                    {t("incidents.status.resolved")}
                  </option>

                  <option value="closed">
                    {t("incidents.status.closed")}
                  </option>
                </select>
              </label>
            )}

            <label className="incidents-v2-form__description">
              <span>{t("incidents.form.description")}</span>

              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows={4}
                placeholder={t("incidents.form.descriptionPlaceholder")}
                required
              />
            </label>

            <div className="incidents-v2-form__actions">
              <button
                type="button"
                className="secondary-button incidents-v2-form__cancel"
                onClick={closeForm}
              >
                {t("incidents.form.cancel")}
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? t("incidents.form.saving")
                  : editingId
                    ? t("incidents.form.save")
                    : t("incidents.form.create")}
              </button>
            </div>
          </form>
          </section>
        </div>
      )}


      <section className="incidents-v2-filters">
        <div className="incidents-v2-filters__heading">
          <div>
            <span>{t("incidents.filters.eyebrow")}</span>

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
              {t("incidents.filters.clear")}
            </button>
          )}
        </div>

        <div className="incidents-v2-filters__grid">
          <label className="incidents-v2-filters__search">
            <span>{t("incidents.filters.search")}</span>

            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder={t("incidents.filters.searchPlaceholder")}
            />
          </label>

          <label>
            <span>{t("incidents.filters.status")}</span>

            <select
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="all">
                {t("incidents.filters.allStatuses")}
              </option>

              <option value="open">
                {t("incidents.filters.open")}
              </option>

              <option value="investigating">
                {t("incidents.filters.investigating")}
              </option>

              <option value="resolved">
                {t("incidents.filters.resolved")}
              </option>

              <option value="closed">
                {t("incidents.filters.closed")}
              </option>
            </select>
          </label>

          <label>
            <span>{t("incidents.filters.severity")}</span>

            <select
              name="severity"
              value={filters.severity}
              onChange={updateFilter}
            >
              <option value="all">
                {t("incidents.filters.allSeverities")}
              </option>

              <option value="low">
                {t("incidents.severity.low")}
              </option>

              <option value="medium">
                {t("incidents.severity.medium")}
              </option>

              <option value="high">
                {t("incidents.severity.high")}
              </option>

              <option value="critical">
                {t("incidents.severity.critical")}
              </option>
            </select>
          </label>

          <label>
            <span>{t("incidents.filters.service")}</span>

            <select
              name="service"
              value={filters.service}
              onChange={updateFilter}
            >
              <option value="all">
                {t("incidents.filters.allServices")}
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
              {t("incidents.inventory.eyebrow")}
            </span>

            <h2>
              {t("incidents.inventory.title")}
            </h2>

            <p>
              {t("incidents.inventory.description")}
            </p>
          </div>

          <div className="incidents-v2-inventory__count">
            <strong>
              {filteredIncidents.length}
            </strong>

            <span>
              {t("incidents.inventory.visible")}
            </span>
          </div>
        </div>


        {loading &&
          incidents.length === 0 && (
            <div className="incidents-v2-empty">
              {t("incidents.inventory.loading")}
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
                  ? t("incidents.inventory.noMatchesTitle")
                  : t("incidents.inventory.emptyTitle")}
              </strong>

              <p>
                {hasFilters
                  ? t("incidents.inventory.noMatchesDescription")
                  : t("incidents.inventory.emptyDescription")}
              </p>
            </div>
          )}


        {filteredIncidents.length > 0 && (
          <div className="incidents-v2-list">
            <div className="incidents-v2-row incidents-v2-row--header">
              <span>{t("incidents.inventory.columns.incident")}</span>
              <span>{t("incidents.inventory.columns.status")}</span>
              <span>{t("incidents.inventory.columns.service")}</span>
              <span>{t("incidents.inventory.columns.duration")}</span>
              <span>{t("incidents.inventory.columns.created")}</span>
              <span>{t("incidents.inventory.columns.actions")}</span>
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
                            {severityLabel(
                              incident.severity,
                              t,
                            )}
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
                            t("incidents.inventory.noDescription")}
                        </p>
                      </div>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label={t(
                        "incidents.inventory.columns.status",
                      )}
                    >
                      <span
                        className={`incidents-v2-status incidents-v2-status--${incident.status}`}
                      >
                        <span />

                        {statusLabel(
                          incident.status,
                          t,
                        )}
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label={t(
                        "incidents.inventory.columns.service",
                      )}
                    >
                      <strong>
                        {serviceMap.get(
                          incident.service_id,
                        ) ||
                          t("incidents.inventory.unassigned")}
                      </strong>

                      <span>
                        {t("incidents.inventory.affectedService")}
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label={t(
                        "incidents.inventory.columns.duration",
                      )}
                    >
                      <strong>
                        {formatDuration(
                          incident.created_at,
                          incident.resolved_at,
                        )}
                      </strong>

                      <span>
                        {incident.resolved_at
                          ? t("incidents.inventory.finalized")
                          : t("incidents.inventory.inProgress")}
                      </span>
                    </div>


                    <div
                      className="incidents-v2-row__metric"
                      data-label={t(
                        "incidents.inventory.columns.created",
                      )}
                    >
                      <strong>
                        {formatDateTime(
                          incident.created_at,
                          language,
                        )}
                      </strong>

                      <span>
                        {incident.resolved_at
                          ? t("incidents.inventory.resolvedAt", {
                              date: formatDateTime(
                                incident.resolved_at,
                                language,
                              ),
                            })
                          : t("incidents.inventory.unresolved")}
                      </span>
                    </div>


                    <div className="incidents-v2-row__actions">
                      <Link
                        to={`/incidentes/${incident.id}`}
                        className="incidents-v2-action incidents-v2-action--primary"
                      >
                        {t("incidents.inventory.detail")}
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
                          {t("incidents.inventory.investigate")}
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
                          {t("incidents.inventory.resolve")}
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
                          {t("incidents.inventory.close")}
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
                        {t("incidents.inventory.edit")}
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
                        {t("incidents.inventory.delete")}
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
