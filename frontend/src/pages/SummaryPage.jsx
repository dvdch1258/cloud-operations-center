/* SUMMARY_I18N_FOUNDATION */
/* SUMMARY_I18N_VISIBLE */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";


const initialSummary = {
  services_total: 0,
  services_up: 0,
  services_down: 0,
  incidents_open: 0,
};

const initialHealth = {
  status: "unknown",
  database: "unknown",
  prometheus: "unknown",
  tempo: "unknown",
  version: "—",
  build_sha: "—",
  environment: "—",
};

const SECURITY_EVENT_KEYS = {
  login_success:
    "summary.security.events.loginSuccess",
  login_failed:
    "summary.security.events.loginFailed",
  login_blocked:
    "summary.security.events.loginBlocked",
  account_locked:
    "summary.security.events.accountLocked",
  account_unlocked:
    "summary.security.events.accountUnlocked",
};

const INCIDENT_STATUS_KEYS = {
  open:
    "summary.incidents.status.open",
  investigating:
    "summary.incidents.status.investigating",
  resolved:
    "summary.incidents.status.resolved",
  closed:
    "summary.incidents.status.closed",
};

const SEVERITY_KEYS = {
  info:
    "summary.security.severity.info",
  low:
    "summary.security.severity.low",
  medium:
    "summary.security.severity.medium",
  high:
    "summary.security.severity.high",
  critical:
    "summary.security.severity.critical",
};

const ACTIVE_INCIDENT_STATUSES =
  new Set(["open", "investigating"]);


function normalizedStatus(value) {
  return String(value || "unknown").toLowerCase();
}


function statusIsHealthy(value) {
  return ["ok", "up", "healthy", "available"].includes(
    normalizedStatus(value),
  );
}


function statusLabel(
  value,
  t,
) {
  const normalized =
    normalizedStatus(value);

  if (
    [
      "ok",
      "up",
      "healthy",
      "available",
    ].includes(normalized)
  ) {
    return t("status.operational");
  }

  if (normalized === "degraded") {
    return t("status.degraded");
  }

  if (
    [
      "down",
      "unhealthy",
      "unavailable",
      "error",
    ].includes(normalized)
  ) {
    return t("status.unavailable");
  }

  return t("status.noData");
}


function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


function formatDateTime(
  value,
  language,
  t,
) {
  if (!value) {
    return t("common.noDate");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("common.noDate");
  }

  return date.toLocaleString(
    localeForLanguage(language),
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function formatUpdateTime(
  value,
  language,
  t,
) {
  if (!value) {
    return t(
      "common.waitingForData",
    );
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


function translatedLabel(
  map,
  value,
  t,
) {
  const key = map[value];

  return key
    ? t(key)
    : value;
}


function environmentLabel(
  value,
  t,
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    !normalized ||
    normalized === "—" ||
    normalized === "production" ||
    normalized === "producción"
  ) {
    return t(
      "environment.production",
    );
  }

  if (
    normalized === "development" ||
    normalized === "desarrollo"
  ) {
    return t(
      "environment.development",
    );
  }

  if (
    normalized === "staging" ||
    normalized === "preproduction" ||
    normalized === "preproducción"
  ) {
    return t(
      "environment.staging",
    );
  }

  return value;
}

function KpiCard({
  label,
  value,
  description,
  tone = "neutral",
}) {
  return (
    <article
      className={`summary-v2-kpi summary-v2-kpi--${tone}`}
    >
      <div className="summary-v2-kpi__header">
        <span>{label}</span>
        <span className="summary-v2-kpi__dot" />
      </div>

      <strong className="summary-v2-kpi__value">
        {value}
      </strong>

      <p>{description}</p>
    </article>
  );
}


function HealthItem({
  label,
  description,
  status,
}) {
  const { t } =
    useTranslation();

  const healthy =
    statusIsHealthy(status);

  return (
    <div className="summary-v2-health-item">
      <span
        className={
          healthy
            ? "summary-v2-health-item__dot summary-v2-health-item__dot--up"
            : "summary-v2-health-item__dot summary-v2-health-item__dot--down"
        }
      />

      <div className="summary-v2-health-item__copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>

      <span
        className={
          healthy
            ? "summary-v2-health-item__status"
            : "summary-v2-health-item__status summary-v2-health-item__status--down"
        }
      >
        {statusLabel(status, t)}
      </span>
    </div>
  );
}


export default function SummaryPage() {
  const {
    t,
    i18n,
  } = useTranslation();

  const language =
    i18n.resolvedLanguage ||
    i18n.language;

  const [summary, setSummary] =
    useState(initialSummary);

  const [health, setHealth] =
    useState(initialHealth);

  const [incidents, setIncidents] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [
    securitySummary,
    setSecuritySummary,
  ] = useState(null);

  const [
    securityEvents,
    setSecurityEvents,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [partialFailures, setPartialFailures] =
    useState([]);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      }

      const results = await Promise.allSettled([
        api.getSummary(),
        api.getDetailedHealth(),
        api.getIncidents(),
        api.getServices(),
        api.getSecuritySummary(),
        api.getSecurityEvents(8),
      ]);

      const labels = [
        "summary.modules.overview",
        "summary.modules.systemHealth",
        "summary.modules.incidents",
        "summary.modules.services",
        "summary.modules.security",
        "summary.modules.securityActivity",
      ];

      const failures = [];

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failures.push(labels[index]);
        }
      });

      if (results[0].status === "fulfilled") {
        setSummary(results[0].value);
      }

      if (results[1].status === "fulfilled") {
        setHealth(results[1].value);
      }

      if (results[2].status === "fulfilled") {
        setIncidents(
          Array.isArray(results[2].value)
            ? results[2].value
            : [],
        );
      }

      if (results[3].status === "fulfilled") {
        setServices(
          Array.isArray(results[3].value)
            ? results[3].value
            : [],
        );
      }

      if (results[4].status === "fulfilled") {
        setSecuritySummary(results[4].value);
      }

      if (results[5].status === "fulfilled") {
        setSecurityEvents(
          Array.isArray(results[5].value)
            ? results[5].value
            : [],
        );
      }

      setPartialFailures(failures);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );


  useEffect(() => {
    loadDashboard();

    const intervalId = window.setInterval(
      loadDashboard,
      30000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);


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


  const activeIncidents = useMemo(
    () =>
      incidents.filter((incident) =>
        ACTIVE_INCIDENT_STATUSES.has(
          incident.status,
        ),
      ),
    [incidents],
  );


  const recentIncidents = useMemo(
    () =>
      [...incidents]
        .sort((a, b) => {
          const aDate =
            new Date(a.created_at || 0).getTime();

          const bDate =
            new Date(b.created_at || 0).getTime();

          return bDate - aDate;
        })
        .slice(0, 5),
    [incidents],
  );


  const activeIncidentCount =
    incidents.length > 0
      ? activeIncidents.length
      : summary.incidents_open || 0;


  const servicesTotal =
    summary.services_total || services.length || 0;

  const servicesUp =
    summary.services_up || 0;

  const servicesDown =
    summary.services_down || 0;

  const availability =
    servicesTotal > 0
      ? Math.round(
          (servicesUp / servicesTotal) * 100,
        )
      : 100;


  const operational =
    partialFailures.length === 0 &&
    servicesDown === 0 &&
    activeIncidentCount === 0 &&
    statusIsHealthy(health.status);


  const securityAttention =
    (securitySummary?.locked_users || 0) > 0 ||
    (securitySummary?.failed_logins_last_24h || 0) > 0;


  return (
    <section className="summary-v2">
      <header className="topbar summary-v2__topbar">
        <div>
          <p className="eyebrow">
            CLOUD OPERATIONS CENTER
          </p>

          <h1>
            {t("summary.title")}
          </h1>

          <p className="subtitle">
            {t("summary.subtitle")}
          </p>
        </div>

        <div className="summary-v2__topbar-actions">
          <span className="summary-v2__updated">
            {t(
              "summary.updated",
              {
                time: formatUpdateTime(
                  lastUpdated,
                  language,
                  t,
                ),
              },
            )}
          </span>

          <button
            type="button"
            className="refresh-button"
            disabled={refreshing}
            onClick={() =>
              loadDashboard({ refresh: true })
            }
          >
            {refreshing
              ? t("common.refreshing")
              : t("common.refresh")}
          </button>
        </div>
      </header>


      {partialFailures.length > 0 && (
        <div className="alert alert--error">
          <strong>
            {t(
              "summary.partialFailureTitle",
            )}
          </strong>

          <span>
            {t(
              "summary.partialFailureDescription",
              {
                modules:
                  partialFailures
                    .map((key) => t(key))
                    .join(", "),
              },
            )}
          </span>
        </div>
      )}


      <section
        className={
          operational
            ? "summary-v2-hero summary-v2-hero--healthy"
            : "summary-v2-hero summary-v2-hero--attention"
        }
      >
        <div className="summary-v2-hero__main">
          <span
            className={
              operational
                ? "summary-v2-hero__pulse summary-v2-hero__pulse--up"
                : "summary-v2-hero__pulse summary-v2-hero__pulse--warning"
            }
          />

          <div>
            <span className="summary-v2-hero__label">
              {t("summary.hero.label")}
            </span>

            <strong>
              {loading
                ? t("summary.hero.checking")
                : operational
                  ? t("summary.hero.operational")
                  : t("summary.hero.attention")}
            </strong>

            <p>
              {operational
                ? t("summary.hero.healthyDescription")
                : t(
                    "summary.hero.attentionDescription",
                    {
                      servicesDown,
                      activeIncidents:
                        activeIncidentCount,
                    },
                  )}
            </p>
          </div>
        </div>

        <div className="summary-v2-hero__meta">
          <span>
            {environmentLabel(
              health.environment,
              t,
            )}
          </span>

          <span>Kubernetes · cloud-ops</span>

          <span>
            v{health.version || "—"}
          </span>
        </div>
      </section>


      <section className="summary-v2-kpis">
        <KpiCard
          label={t("nav.services")}
          value={loading ? "—" : servicesTotal}
          description={t(
            "summary.kpi.servicesRegistered",
          )}
          tone="neutral"
        />

        <KpiCard
          label={t(
            "summary.kpi.healthyServices",
          )}
          value={loading ? "—" : servicesUp}
          description={t(
            "summary.kpi.available",
            {
              value: availability,
            },
          )}
          tone="success"
        />

        <KpiCard
          label={t(
            "summary.kpi.servicesDown",
          )}
          value={loading ? "—" : servicesDown}
          description={
            servicesDown > 0
              ? t(
                  "summary.kpi.interventionRequired",
                )
              : t(
                  "summary.kpi.noInterruptions",
                )
          }
          tone={
            servicesDown > 0
              ? "danger"
              : "success"
          }
        />

        <KpiCard
          label={t(
            "summary.kpi.activeIncidents",
          )}
          value={
            loading
              ? "—"
              : activeIncidentCount
          }
          description={t(
            "summary.kpi.activeIncidentsDescription",
          )}
          tone={
            activeIncidentCount > 0
              ? "warning"
              : "success"
          }
        />

        <KpiCard
          label={t(
            "summary.kpi.securityEvents",
          )}
          value={
            loading
              ? "—"
              : securitySummary?.events_last_24h ?? 0
          }
          description={t(
            "summary.kpi.activityRecorded",
          )}
          tone="neutral"
        />

        <KpiCard
          label={t(
            "summary.kpi.failedLogins",
          )}
          value={
            loading
              ? "—"
              : securitySummary?.failed_logins_last_24h ?? 0
          }
          description={
            securityAttention
              ? t(
                  "summary.kpi.reviewActivity",
                )
              : t(
                  "summary.kpi.noAnomalousActivity",
                )
          }
          tone={
            securityAttention
              ? "warning"
              : "success"
          }
        />
      </section>


      <div className="summary-v2-layout">
        <section className="summary-v2-panel">
          <div className="summary-v2-panel__header">
            <div>
              <span className="summary-v2-panel__eyebrow">
                {t(
                  "summary.infrastructure.eyebrow",
                )}
              </span>

              <h2>
                {t(
                  "summary.infrastructure.title",
                )}
              </h2>
            </div>

            <Link
              to="/sistema"
              className="summary-v2-panel__link"
            >
              {t(
                "summary.infrastructure.viewSystem",
              )}
            </Link>
          </div>

          <div className="summary-v2-health">
            <HealthItem
              label="PostgreSQL"
              description={t(
                "summary.infrastructure.database",
              )}
              status={health.database}
            />

            <HealthItem
              label="Prometheus"
              description={t(
                "summary.infrastructure.prometheus",
              )}
              status={health.prometheus}
            />

            <HealthItem
              label="Tempo"
              description={t(
                "summary.infrastructure.tempo",
              )}
              status={health.tempo}
            />
          </div>

          <div className="summary-v2-availability">
            <div>
              <span>
                {t(
                  "summary.infrastructure.availability",
                )}
              </span>
              <strong>{availability}%</strong>
            </div>

            <div
              className="summary-v2-availability__track"
              aria-label={t(
                "summary.infrastructure.availabilityAria",
                {
                  value: availability,
                },
              )}
            >
              <span
                style={{
                  width: `${Math.min(
                    Math.max(availability, 0),
                    100,
                  )}%`,
                }}
              />
            </div>

            <small>
              {t(
                "summary.infrastructure.operationalServices",
                {
                  up: servicesUp,
                  total: servicesTotal,
                },
              )}
            </small>
          </div>
        </section>


        <section className="summary-v2-panel">
          <div className="summary-v2-panel__header">
            <div>
              <span className="summary-v2-panel__eyebrow">
                {t(
                  "summary.incidents.eyebrow",
                )}
              </span>

              <h2>
                {t(
                  "summary.incidents.title",
                )}
              </h2>
            </div>

            <Link
              to="/incidentes"
              className="summary-v2-panel__link"
            >
              {t(
                "summary.incidents.viewAll",
              )}
            </Link>
          </div>

          <div className="summary-v2-list">
            {!loading &&
              recentIncidents.length === 0 && (
                <div className="summary-v2-empty">
                  <span className="summary-v2-empty__check">
                    ✓
                  </span>

                  <div>
                    <strong>
                      {t(
                        "summary.incidents.noneTitle",
                      )}
                    </strong>
                    <span>
                      {t(
                        "summary.incidents.noneDescription",
                      )}
                    </span>
                  </div>
                </div>
              )}

            {recentIncidents.map((incident) => (
              <Link
                key={incident.id}
                to={`/incidentes/${incident.id}`}
                className="summary-v2-incident"
              >
                <span
                  className={`summary-v2-severity summary-v2-severity--${
                    incident.severity || "medium"
                  }`}
                />

                <div className="summary-v2-incident__main">
                  <strong>
                    {incident.title}
                  </strong>

                  <span>
                    {serviceMap.get(
                      incident.service_id,
                    ) ||
                      t(
                        "summary.incidents.unassignedService",
                      )}
                  </span>
                </div>

                <div className="summary-v2-incident__meta">
                  <span
                    className={`summary-v2-status-pill summary-v2-status-pill--${
                      incident.status || "open"
                    }`}
                  >
                    {translatedLabel(
                      INCIDENT_STATUS_KEYS,
                      incident.status,
                      t,
                    )}
                  </span>

                  <small>
                    {formatDateTime(
                      incident.created_at,
                      language,
                      t,
                    )}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>


      <div className="summary-v2-layout summary-v2-layout--secondary">
        <section className="summary-v2-panel">
          <div className="summary-v2-panel__header">
            <div>
              <span className="summary-v2-panel__eyebrow">
                {t(
                  "summary.security.eyebrow",
                )}
              </span>

              <h2>
                {t(
                  "summary.security.title",
                )}
              </h2>
            </div>

            <Link
              to="/seguridad"
              className="summary-v2-panel__link"
            >
              {t(
                "summary.security.viewSecurity",
              )}
            </Link>
          </div>

          <div className="summary-v2-events">
            {!loading &&
              securityEvents.length === 0 && (
                <div className="summary-v2-empty">
                  <div>
                    <strong>
                      {t(
                        "summary.security.noneTitle",
                      )}
                    </strong>

                    <span>
                      {t(
                        "summary.security.noneDescription",
                      )}
                    </span>
                  </div>
                </div>
              )}

            {securityEvents
              .slice(0, 5)
              .map((event, index) => {
                const type =
                  event.event_type ||
                  event.type ||
                  "security_event";

                const severity =
                  event.severity || "info";

                const timestamp =
                  event.created_at ||
                  event.timestamp;

                return (
                  <div
                    className="summary-v2-event"
                    key={
                      event.id ||
                      `${type}-${index}`
                    }
                  >
                    <span
                      className={`summary-v2-event__dot summary-v2-event__dot--${severity}`}
                    />

                    <div>
                      <strong>
                        {translatedLabel(
                          SECURITY_EVENT_KEYS,
                          type,
                          t,
                        )}
                      </strong>

                      <span>
                        {event.username ||
                          event.ip_address ||
                          t("summary.security.platform")}
                      </span>
                    </div>

                    <div className="summary-v2-event__meta">
                      <span>
                        {translatedLabel(
                          SEVERITY_KEYS,
                          severity,
                          t,
                        )}
                      </span>

                      <small>
                        {formatDateTime(
                          timestamp,
                          language,
                          t,
                        )}
                      </small>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>


        <section className="summary-v2-panel summary-v2-panel--quick">
          <div className="summary-v2-panel__header">
            <div>
              <span className="summary-v2-panel__eyebrow">
                {t(
                  "summary.quick.eyebrow",
                )}
              </span>

              <h2>
                {t(
                  "summary.quick.title",
                )}
              </h2>
            </div>
          </div>

          <div className="summary-v2-quick-grid">
            <Link
              to="/servicios"
              className="summary-v2-quick-link"
            >
              <span>{t("nav.services")}</span>
              <strong>
                {servicesUp}/{servicesTotal}
              </strong>
              <small>
                {t(
                  "summary.quick.servicesHint",
                )}
              </small>
            </Link>

            <Link
              to="/incidentes"
              className="summary-v2-quick-link"
            >
              <span>{t("nav.incidents")}</span>
              <strong>{activeIncidentCount}</strong>
              <small>
                {t(
                  "summary.quick.incidentsHint",
                )}
              </small>
            </Link>

            <Link
              to="/observabilidad"
              className="summary-v2-quick-link"
            >
              <span>{t("nav.observability")}</span>
              <strong>
                {t(
                  "summary.quick.metrics",
                )}
              </strong>
              <small>
                {t(
                  "summary.quick.observabilityHint",
                )}
              </small>
            </Link>

            <Link
              to="/seguridad"
              className="summary-v2-quick-link"
            >
              <span>{t("nav.security")}</span>
              <strong>
                {securitySummary?.locked_users ?? 0}
              </strong>
              <small>
                {t(
                  "summary.quick.securityHint",
                )}
              </small>
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
