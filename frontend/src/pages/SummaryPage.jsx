import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

const SECURITY_EVENT_LABELS = {
  login_success: "Inicio de sesión",
  login_failed: "Login fallido",
  login_blocked: "Login bloqueado",
  account_locked: "Cuenta bloqueada",
  account_unlocked: "Cuenta desbloqueada",
};

const INCIDENT_STATUS_LABELS = {
  open: "Abierto",
  investigating: "Investigando",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const SEVERITY_LABELS = {
  info: "Info",
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
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


function statusLabel(value) {
  const normalized = normalizedStatus(value);

  if (
    ["ok", "up", "healthy", "available"].includes(normalized)
  ) {
    return "Operativo";
  }

  if (normalized === "degraded") {
    return "Degradado";
  }

  if (
    ["down", "unhealthy", "unavailable", "error"].includes(
      normalized,
    )
  ) {
    return "No disponible";
  }

  return "Sin datos";
}


function formatDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatUpdateTime(value) {
  if (!value) {
    return "Esperando datos";
  }

  return value.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
  const healthy = statusIsHealthy(status);

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
        {statusLabel(status)}
      </span>
    </div>
  );
}


export default function SummaryPage() {
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
        "resumen",
        "salud del sistema",
        "incidentes",
        "servicios",
        "seguridad",
        "actividad de seguridad",
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

          <h1>Resumen</h1>

          <p className="subtitle">
            Estado operativo de la plataforma,
            infraestructura, incidentes y seguridad.
          </p>
        </div>

        <div className="summary-v2__topbar-actions">
          <span className="summary-v2__updated">
            Actualizado · {formatUpdateTime(lastUpdated)}
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
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </header>


      {partialFailures.length > 0 && (
        <div className="alert alert--error">
          <strong>
            Algunos módulos no han respondido
          </strong>

          <span>
            No se pudieron actualizar:{" "}
            {partialFailures.join(", ")}.
            El resto del dashboard continúa disponible.
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
              ESTADO GENERAL
            </span>

            <strong>
              {loading
                ? "Comprobando plataforma..."
                : operational
                  ? "Todos los sistemas operativos"
                  : "La plataforma requiere atención"}
            </strong>

            <p>
              {operational
                ? "No se detectan servicios caídos ni incidentes activos."
                : `${servicesDown} servicios caídos · ${activeIncidentCount} incidentes activos`}
            </p>
          </div>
        </div>

        <div className="summary-v2-hero__meta">
          <span>
            {health.environment || "Producción"}
          </span>

          <span>Kubernetes · cloud-ops</span>

          <span>
            v{health.version || "—"}
          </span>
        </div>
      </section>


      <section className="summary-v2-kpis">
        <KpiCard
          label="Servicios"
          value={loading ? "—" : servicesTotal}
          description="Servicios registrados"
          tone="neutral"
        />

        <KpiCard
          label="Operativos"
          value={loading ? "—" : servicesUp}
          description={`${availability}% disponibles`}
          tone="success"
        />

        <KpiCard
          label="Servicios caídos"
          value={loading ? "—" : servicesDown}
          description={
            servicesDown > 0
              ? "Requieren intervención"
              : "Sin interrupciones"
          }
          tone={
            servicesDown > 0
              ? "danger"
              : "success"
          }
        />

        <KpiCard
          label="Incidentes activos"
          value={
            loading
              ? "—"
              : activeIncidentCount
          }
          description="Abiertos o investigando"
          tone={
            activeIncidentCount > 0
              ? "warning"
              : "success"
          }
        />

        <KpiCard
          label="Eventos seguridad · 24h"
          value={
            loading
              ? "—"
              : securitySummary?.events_last_24h ?? 0
          }
          description="Actividad registrada"
          tone="neutral"
        />

        <KpiCard
          label="Logins fallidos · 24h"
          value={
            loading
              ? "—"
              : securitySummary?.failed_logins_last_24h ?? 0
          }
          description={
            securityAttention
              ? "Revisar actividad"
              : "Sin actividad anómala"
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
                INFRAESTRUCTURA
              </span>

              <h2>Salud de la plataforma</h2>
            </div>

            <Link
              to="/sistema"
              className="summary-v2-panel__link"
            >
              Ver sistema →
            </Link>
          </div>

          <div className="summary-v2-health">
            <HealthItem
              label="PostgreSQL"
              description="Base de datos principal"
              status={health.database}
            />

            <HealthItem
              label="Prometheus"
              description="Métricas y monitorización"
              status={health.prometheus}
            />

            <HealthItem
              label="Tempo"
              description="Trazas distribuidas"
              status={health.tempo}
            />
          </div>

          <div className="summary-v2-availability">
            <div>
              <span>Disponibilidad de servicios</span>
              <strong>{availability}%</strong>
            </div>

            <div
              className="summary-v2-availability__track"
              aria-label={`Disponibilidad ${availability}%`}
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
              {servicesUp} de {servicesTotal} servicios
              operativos
            </small>
          </div>
        </section>


        <section className="summary-v2-panel">
          <div className="summary-v2-panel__header">
            <div>
              <span className="summary-v2-panel__eyebrow">
                INCIDENT MANAGEMENT
              </span>

              <h2>Incidentes recientes</h2>
            </div>

            <Link
              to="/incidentes"
              className="summary-v2-panel__link"
            >
              Ver todos →
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
                    <strong>Sin incidentes</strong>
                    <span>
                      No hay incidentes registrados.
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
                      "Servicio sin asignar"}
                  </span>
                </div>

                <div className="summary-v2-incident__meta">
                  <span
                    className={`summary-v2-status-pill summary-v2-status-pill--${
                      incident.status || "open"
                    }`}
                  >
                    {INCIDENT_STATUS_LABELS[
                      incident.status
                    ] || incident.status}
                  </span>

                  <small>
                    {formatDateTime(
                      incident.created_at,
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
                SECURITY OPERATIONS
              </span>

              <h2>Actividad reciente</h2>
            </div>

            <Link
              to="/seguridad"
              className="summary-v2-panel__link"
            >
              Ver seguridad →
            </Link>
          </div>

          <div className="summary-v2-events">
            {!loading &&
              securityEvents.length === 0 && (
                <div className="summary-v2-empty">
                  <div>
                    <strong>
                      Sin eventos recientes
                    </strong>

                    <span>
                      No hay actividad de seguridad
                      reciente.
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
                        {SECURITY_EVENT_LABELS[type] ||
                          type}
                      </strong>

                      <span>
                        {event.username ||
                          event.ip_address ||
                          "Plataforma"}
                      </span>
                    </div>

                    <div className="summary-v2-event__meta">
                      <span>
                        {SEVERITY_LABELS[severity] ||
                          severity}
                      </span>

                      <small>
                        {formatDateTime(timestamp)}
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
                NAVEGACIÓN
              </span>

              <h2>Acceso rápido</h2>
            </div>
          </div>

          <div className="summary-v2-quick-grid">
            <Link
              to="/servicios"
              className="summary-v2-quick-link"
            >
              <span>Servicios</span>
              <strong>
                {servicesUp}/{servicesTotal}
              </strong>
              <small>Estado y disponibilidad</small>
            </Link>

            <Link
              to="/incidentes"
              className="summary-v2-quick-link"
            >
              <span>Incidentes</span>
              <strong>{activeIncidentCount}</strong>
              <small>Gestión operativa</small>
            </Link>

            <Link
              to="/observabilidad"
              className="summary-v2-quick-link"
            >
              <span>Observabilidad</span>
              <strong>Metrics</strong>
              <small>Logs, métricas y trazas</small>
            </Link>

            <Link
              to="/seguridad"
              className="summary-v2-quick-link"
            >
              <span>Seguridad</span>
              <strong>
                {securitySummary?.locked_users ?? 0}
              </strong>
              <small>Bloqueos activos</small>
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
