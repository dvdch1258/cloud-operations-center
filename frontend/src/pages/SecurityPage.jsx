import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { api } from "../api/client";

import "./SecurityPage.css";


const EVENT_LABELS = {
  login_success: "Inicio de sesión",
  login_failed: "Login fallido",
  login_blocked: "Login bloqueado",
  account_locked: "Cuenta bloqueada",
  account_unlocked: "Cuenta desbloqueada",
};


const SEVERITY_LABELS = {
  info: "Info",
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
  INFO: "Info",
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
  UNKNOWN: "Desconocida",
};


const ALERT_STATUS_LABELS = {
  open: "Abierta",
  acknowledged: "Reconocida",
  resolved: "Resuelta",
};


const SECURITY_AREAS = [
  {
    path: "/seguridad/vulnerabilidades",
    eyebrow: "EXPOSURE",
    title: "Vulnerabilidades",
    description:
      "Findings detectados, severidad, componentes y versiones con corrección.",
  },
  {
    path: "/seguridad/alertas",
    eyebrow: "DETECTION",
    title: "Alertas",
    description:
      "Señales activas que requieren reconocimiento o resolución operativa.",
  },
  {
    path: "/seguridad/compliance",
    eyebrow: "CONTROL",
    title: "Compliance",
    description:
      "Controles técnicos evaluados contra el estado real de la plataforma.",
  },
  {
    path: "/seguridad/policies",
    eyebrow: "GOVERNANCE",
    title: "Policies",
    description:
      "Políticas efectivas aplicadas por los controles de seguridad.",
  },
];


function formatEventType(value) {
  return EVENT_LABELS[value] || value || "Evento";
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatFullDate(value) {
  if (!value) {
    return "Sin datos";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatRelative(value) {
  if (!value) {
    return "sin actividad";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "fecha desconocida";
  }

  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 60000),
  );

  if (diffMinutes < 1) {
    return "ahora";
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const hours = Math.round(diffMinutes / 60);

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.round(hours / 24);

  return `hace ${days} d`;
}


function clampScore(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(100, parsed));
}


function severityPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, (Number(value || 0) / total) * 100),
  );
}


function getSecurityState({
  vulnerability,
  alertSummary,
  compliance,
  summary,
}) {
  const criticalSignals =
    Number(vulnerability?.critical || 0) +
    Number(alertSummary?.critical_active || 0);

  if (criticalSignals > 0) {
    return {
      tone: "critical",
      label: "Atención crítica",
      description:
        "Hay señales críticas activas en la superficie de seguridad.",
    };
  }

  const warningSignals =
    Number(vulnerability?.high || 0) +
    Number(alertSummary?.high_active || 0) +
    Number(summary?.locked_users || 0) +
    Number(compliance?.failed || 0);

  if (warningSignals > 0) {
    return {
      tone: "warning",
      label: "Revisión recomendada",
      description:
        "Hay señales que requieren seguimiento operativo.",
    };
  }

  return {
    tone: "healthy",
    label: "Postura estable",
    description:
      "No hay señales críticas o altas activas en los controles actuales.",
  };
}


function Metric({
  label,
  value,
  detail,
  tone = "neutral",
}) {
  return (
    <article
      className={`security-v2__metric security-v2__metric--${tone}`}
    >
      <div className="security-v2__metric-top">
        <span>{label}</span>
        <i />
      </div>

      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}


export default function SecurityPage() {
  const [data, setData] = useState({
    summary: null,
    events: [],
    vulnerability: null,
    alertSummary: null,
    alerts: [],
    compliance: null,
    policies: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  const loadSecurity = useCallback(async ({
    refresh = false,
  } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        summary,
        events,
        vulnerability,
        alertSummary,
        alerts,
        compliance,
        policies,
      ] = await Promise.all([
        api.getSecuritySummary(),
        api.getSecurityEvents(8),
        api.getVulnerabilitySummary(),
        api.getSecurityAlertSummary(),
        api.getSecurityAlerts({ limit: 6 }),
        api.getComplianceSummary(),
        api.getSecurityPolicies(),
      ]);

      setData({
        summary,
        events,
        vulnerability,
        alertSummary,
        alerts,
        compliance,
        policies,
      });
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo cargar el Security Command Center.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);


  const securityState = useMemo(
    () => getSecurityState(data),
    [data],
  );


  const complianceScore =
    clampScore(data.compliance?.score);

  const ringRadius = 48;
  const ringCircumference =
    2 * Math.PI * ringRadius;

  const ringOffset =
    ringCircumference -
    ringCircumference * (complianceScore / 100);

  const activeAlerts =
    Number(data.alertSummary?.open || 0) +
    Number(data.alertSummary?.acknowledged || 0);

  const highRiskFindings =
    Number(data.vulnerability?.critical || 0) +
    Number(data.vulnerability?.high || 0);

  const vulnerabilityTotal =
    Number(data.vulnerability?.total_findings || 0);


  return (
    <section className="security-page security-v2">
      <header className="topbar security-v2__topbar">
        <div>
          <p className="eyebrow">
            SECURITY COMMAND CENTER
          </p>

          <h1>Seguridad</h1>

          <p className="subtitle">
            Riesgo, detección, autenticación y controles
            técnicos de la plataforma en una única vista.
          </p>
        </div>

        <div className="security-v2__actions">
          <span className="security-v2__live">
            <i />
            LIVE CONTROL PLANE
          </span>

          <button
            type="button"
            className="refresh-button"
            disabled={refreshing}
            onClick={() =>
              loadSecurity({ refresh: true })
            }
          >
            {refreshing
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </header>


      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudo cargar Seguridad
          </strong>
          <span>{error}</span>
        </div>
      )}


      <section
        className={
          `security-v2__state ` +
          `security-v2__state--${securityState.tone}`
        }
      >
        <div className="security-v2__state-main">
          <span className="security-v2__state-icon">
            <i />
          </span>

          <div>
            <span className="security-v2__state-kicker">
              CURRENT SECURITY STATE
            </span>

            <strong>
              {loading
                ? "Evaluando señales..."
                : securityState.label}
            </strong>

            <p>
              {loading
                ? "Consultando controles y telemetría de seguridad."
                : securityState.description}
            </p>
          </div>
        </div>

        <div className="security-v2__state-meta">
          <div>
            <span>Último scan</span>
            <strong>
              {loading
                ? "—"
                : formatRelative(
                    data.vulnerability?.last_scanned_at,
                  )}
            </strong>
          </div>

          <div>
            <span>Última alerta</span>
            <strong>
              {loading
                ? "—"
                : formatRelative(
                    data.alertSummary?.last_seen_at,
                  )}
            </strong>
          </div>

          <span className="environment-badge">
            Producción
          </span>
        </div>
      </section>


      <div className="security-v2__hero-grid">
        <section className="security-v2__posture-card">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                CONTROL POSTURE
              </p>
              <h2>Security posture</h2>
            </div>

            <span className="security-v2__micro-badge">
              COMPLIANCE
            </span>
          </div>

          <div className="security-v2__posture-body">
            <div className="security-v2__ring">
              <svg
                viewBox="0 0 120 120"
                role="img"
                aria-label={`Compliance ${complianceScore}%`}
              >
                <defs>
                  <linearGradient
                    id="security-posture-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6ea8ff"
                    />
                    <stop
                      offset="100%"
                      stopColor="#4de3c1"
                    />
                  </linearGradient>
                </defs>

                <circle
                  className="security-v2__ring-track"
                  cx="60"
                  cy="60"
                  r={ringRadius}
                />

                <circle
                  className="security-v2__ring-progress"
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={
                    loading
                      ? ringCircumference
                      : ringOffset
                  }
                />
              </svg>

              <div className="security-v2__ring-value">
                <strong>
                  {loading
                    ? "—"
                    : `${complianceScore}%`}
                </strong>
                <span>compliance</span>
              </div>
            </div>

            <div className="security-v2__posture-stats">
              <div>
                <span>Passed controls</span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.passed ?? 0}
                </strong>
              </div>

              <div>
                <span>Failed controls</span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.failed ?? 0}
                </strong>
              </div>

              <div>
                <span>Evaluated</span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.total ?? 0}
                </strong>
              </div>
            </div>
          </div>

          <div className="security-v2__posture-footer">
            <span>
              Última evaluación
            </span>

            <strong>
              {loading
                ? "—"
                : formatFullDate(
                    data.compliance?.evaluated_at,
                  )}
            </strong>
          </div>
        </section>


        <section className="security-v2__radar-card">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                SECURITY SIGNALS
              </p>
              <h2>Superficie activa</h2>
            </div>

            <span className="security-v2__signal-status">
              <i />
              REAL-TIME VIEW
            </span>
          </div>

          <div className="security-v2__radar-layout">
            <div
              className={
                `security-v2__radar ` +
                `security-v2__radar--${securityState.tone}`
              }
            >
              <div className="security-v2__radar-ring security-v2__radar-ring--1" />
              <div className="security-v2__radar-ring security-v2__radar-ring--2" />
              <div className="security-v2__radar-ring security-v2__radar-ring--3" />

              <div className="security-v2__radar-axis security-v2__radar-axis--x" />
              <div className="security-v2__radar-axis security-v2__radar-axis--y" />

              <div className="security-v2__radar-sweep" />

              <span className="security-v2__radar-dot security-v2__radar-dot--1" />
              <span className="security-v2__radar-dot security-v2__radar-dot--2" />
              <span className="security-v2__radar-dot security-v2__radar-dot--3" />
              <span className="security-v2__radar-dot security-v2__radar-dot--4" />

              <div className="security-v2__radar-core">
                <span>COC</span>
                <strong>SEC</strong>
              </div>
            </div>

            <div className="security-v2__signal-list">
              <article>
                <span>
                  Critical findings
                </span>
                <strong>
                  {loading
                    ? "—"
                    : data.vulnerability?.critical ?? 0}
                </strong>
              </article>

              <article>
                <span>
                  Active alerts
                </span>
                <strong>
                  {loading ? "—" : activeAlerts}
                </strong>
              </article>

              <article>
                <span>
                  Locked accounts
                </span>
                <strong>
                  {loading
                    ? "—"
                    : data.summary?.locked_users ?? 0}
                </strong>
              </article>

              <article>
                <span>
                  Failed controls
                </span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.failed ?? 0}
                </strong>
              </article>
            </div>
          </div>
        </section>
      </div>


      <div className="security-v2__metrics">
        <Metric
          label="Eventos · 24h"
          value={
            loading
              ? "—"
              : data.summary?.events_last_24h ?? 0
          }
          detail="Actividad de autenticación registrada"
        />

        <Metric
          label="Logins fallidos · 24h"
          value={
            loading
              ? "—"
              : data.summary?.failed_logins_last_24h ?? 0
          }
          detail="Intentos de autenticación fallidos"
          tone={
            Number(
              data.summary?.failed_logins_last_24h || 0,
            ) > 0
              ? "warning"
              : "neutral"
          }
        />

        <Metric
          label="Alertas activas"
          value={loading ? "—" : activeAlerts}
          detail="Abiertas o reconocidas"
          tone={
            Number(
              data.alertSummary?.critical_active || 0,
            ) > 0
              ? "critical"
              : activeAlerts > 0
                ? "warning"
                : "healthy"
          }
        />

        <Metric
          label="High + Critical"
          value={loading ? "—" : highRiskFindings}
          detail="Findings de mayor severidad"
          tone={
            Number(
              data.vulnerability?.critical || 0,
            ) > 0
              ? "critical"
              : highRiskFindings > 0
                ? "warning"
                : "healthy"
          }
        />
      </div>


      <div className="security-v2__workspace">
        <section className="security-v2__panel security-v2__exposure">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                VULNERABILITY EXPOSURE
              </p>
              <h2>Risk distribution</h2>
              <p>
                Findings del último scan disponible
                por componente.
              </p>
            </div>

            <Link
              className="security-v2__text-link"
              to="/seguridad/vulnerabilidades"
            >
              Ver findings →
            </Link>
          </div>

          <div className="security-v2__exposure-total">
            <div>
              <span>Total findings</span>
              <strong>
                {loading
                  ? "—"
                  : vulnerabilityTotal}
              </strong>
            </div>

            <div>
              <span>Fix available</span>
              <strong>
                {loading
                  ? "—"
                  : data.vulnerability?.fix_available ?? 0}
              </strong>
            </div>

            <div>
              <span>Components</span>
              <strong>
                {loading
                  ? "—"
                  : data.vulnerability?.components ?? 0}
              </strong>
            </div>
          </div>

          <div className="security-v2__severity-stack">
            <span
              className="security-v2__severity-segment security-v2__severity-segment--critical"
              style={{
                width: `${
                  severityPercent(
                    data.vulnerability?.critical,
                    vulnerabilityTotal,
                  )
                }%`,
              }}
            />

            <span
              className="security-v2__severity-segment security-v2__severity-segment--high"
              style={{
                width: `${
                  severityPercent(
                    data.vulnerability?.high,
                    vulnerabilityTotal,
                  )
                }%`,
              }}
            />

            <span
              className="security-v2__severity-segment security-v2__severity-segment--medium"
              style={{
                width: `${
                  severityPercent(
                    data.vulnerability?.medium,
                    vulnerabilityTotal,
                  )
                }%`,
              }}
            />

            <span
              className="security-v2__severity-segment security-v2__severity-segment--low"
              style={{
                width: `${
                  severityPercent(
                    data.vulnerability?.low,
                    vulnerabilityTotal,
                  )
                }%`,
              }}
            />

            <span
              className="security-v2__severity-segment security-v2__severity-segment--unknown"
              style={{
                width: `${
                  severityPercent(
                    data.vulnerability?.unknown,
                    vulnerabilityTotal,
                  )
                }%`,
              }}
            />
          </div>

          <div className="security-v2__severity-grid">
            {[
              [
                "critical",
                "Critical",
                data.vulnerability?.critical,
              ],
              [
                "high",
                "High",
                data.vulnerability?.high,
              ],
              [
                "medium",
                "Medium",
                data.vulnerability?.medium,
              ],
              [
                "low",
                "Low",
                data.vulnerability?.low,
              ],
              [
                "unknown",
                "Unknown",
                data.vulnerability?.unknown,
              ],
            ].map(([severity, label, value]) => (
              <div
                key={severity}
                className="security-v2__severity-item"
              >
                <span
                  className={
                    `security-v2__severity-dot ` +
                    `security-v2__severity-dot--${severity}`
                  }
                />

                <span>{label}</span>

                <strong>
                  {loading ? "—" : value ?? 0}
                </strong>
              </div>
            ))}
          </div>

          <div className="security-v2__scan-meta">
            <span>
              LAST SCAN
            </span>

            <strong>
              {loading
                ? "—"
                : formatFullDate(
                    data.vulnerability?.last_scanned_at,
                  )}
            </strong>
          </div>
        </section>


        <section className="security-v2__panel security-v2__control-plane">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                CONTROL PLANE
              </p>
              <h2>Governance status</h2>
              <p>
                Compliance y políticas efectivas
                aplicadas por el backend.
              </p>
            </div>
          </div>

          <div className="security-v2__control-grid">
            <Link
              to="/seguridad/compliance"
              className="security-v2__control-card"
            >
              <div>
                <span>Compliance</span>
                <strong>
                  {loading
                    ? "—"
                    : `${complianceScore}%`}
                </strong>
              </div>

              <p>
                {loading
                  ? "Evaluando controles..."
                  : `${
                      data.compliance?.passed ?? 0
                    } passed · ${
                      data.compliance?.failed ?? 0
                    } failed`}
              </p>

              <span className="security-v2__control-arrow">
                ↗
              </span>
            </Link>

            <Link
              to="/seguridad/policies"
              className="security-v2__control-card"
            >
              <div>
                <span>Policies</span>
                <strong>
                  {loading
                    ? "—"
                    : data.policies?.total ?? 0}
                </strong>
              </div>

              <p>
                {loading
                  ? "Cargando políticas..."
                  : `${
                      data.policies?.enforced ?? 0
                    } enforced · ${
                      data.policies?.enabled ?? 0
                    } enabled`}
              </p>

              <span className="security-v2__control-arrow">
                ↗
              </span>
            </Link>
          </div>

          <div className="security-v2__control-preview">
            <div className="security-v2__control-preview-head">
              <span>CONTROL STATUS</span>
              <strong>
                {loading
                  ? "—"
                  : `${
                      data.compliance?.passed ?? 0
                    } / ${
                      data.compliance?.total ?? 0
                    }`}
              </strong>
            </div>

            <div className="security-v2__control-progress">
              <span
                style={{
                  width: `${complianceScore}%`,
                }}
              />
            </div>

            <div className="security-v2__control-dots">
              {(data.compliance?.controls || [])
                .slice(0, 8)
                .map((control) => (
                  <span
                    key={control.control_id}
                    title={
                      `${control.control_id}: ` +
                      `${control.title}`
                    }
                    className={
                      `security-v2__control-dot ` +
                      `security-v2__control-dot--${control.status}`
                    }
                  />
                ))}
            </div>
          </div>
        </section>
      </div>


      <div className="security-v2__activity-grid">
        <section className="security-v2__panel">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                ACTIVE DETECTIONS
              </p>
              <h2>Alert stream</h2>
              <p>
                Últimas señales registradas por
                los controles de seguridad.
              </p>
            </div>

            <Link
              className="security-v2__text-link"
              to="/seguridad/alertas"
            >
              Ver alertas →
            </Link>
          </div>

          <div className="security-v2__alert-list">
            {loading ? (
              <div className="security-v2__empty">
                Cargando alertas...
              </div>
            ) : data.alerts.length === 0 ? (
              <div className="security-v2__empty">
                <strong>
                  No hay alertas registradas
                </strong>
                <span>
                  Las nuevas detecciones aparecerán aquí.
                </span>
              </div>
            ) : (
              data.alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="security-v2__alert-row"
                >
                  <span
                    className={
                      `security-v2__alert-severity ` +
                      `security-v2__alert-severity--${(
                        alert.severity || "unknown"
                      ).toLowerCase()}`
                    }
                  />

                  <div className="security-v2__alert-content">
                    <div>
                      <strong>{alert.title}</strong>

                      <span
                        className={
                          `security-alert-status ` +
                          `security-alert-status--${alert.status}`
                        }
                      >
                        {ALERT_STATUS_LABELS[alert.status] ||
                          alert.status}
                      </span>
                    </div>

                    <p>
                      {alert.component ||
                        alert.category ||
                        "security"}
                      {" · "}
                      {SEVERITY_LABELS[alert.severity] ||
                        alert.severity}
                    </p>
                  </div>

                  <time>
                    {formatRelative(alert.last_seen_at)}
                  </time>
                </article>
              ))
            )}
          </div>
        </section>


        <section className="security-v2__panel">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                AUTHENTICATION AUDIT
              </p>
              <h2>Security activity</h2>
              <p>
                Eventos recientes del sistema
                de autenticación.
              </p>
            </div>

            <span className="security-v2__micro-badge">
              {data.events.length} EVENTS
            </span>
          </div>

          <div className="security-v2__timeline">
            {loading ? (
              <div className="security-v2__empty">
                Cargando actividad...
              </div>
            ) : data.events.length === 0 ? (
              <div className="security-v2__empty">
                <strong>
                  Sin eventos recientes
                </strong>
                <span>
                  La actividad aparecerá aquí.
                </span>
              </div>
            ) : (
              data.events.map((event) => (
                <article
                  key={event.id}
                  className="security-v2__timeline-item"
                >
                  <div className="security-v2__timeline-rail">
                    <span
                      className={
                        `security-v2__timeline-dot ` +
                        `security-v2__timeline-dot--${event.severity}`
                      }
                    />
                  </div>

                  <div className="security-v2__timeline-content">
                    <div>
                      <strong>
                        {formatEventType(
                          event.event_type,
                        )}
                      </strong>

                      <time>
                        {formatDate(event.created_at)}
                      </time>
                    </div>

                    <p>{event.description}</p>

                    <span>
                      {event.username || "sistema"}
                      {" · "}
                      {event.ip_address || "IP no disponible"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>


      <section className="security-v2__navigation">
        <div className="security-v2__navigation-heading">
          <div>
            <p className="eyebrow">
              SECURITY WORKSPACE
            </p>

            <h2>Investiga cada capa</h2>
          </div>

          <p>
            Accede al detalle de exposición,
            detección, controles y gobierno.
          </p>
        </div>

        <div className="security-v2__area-grid">
          {SECURITY_AREAS.map((area, index) => (
            <Link
              key={area.path}
              to={area.path}
              className="security-v2__area"
            >
              <span className="security-v2__area-index">
                0{index + 1}
              </span>

              <div>
                <p>{area.eyebrow}</p>
                <h3>{area.title}</h3>
                <span>{area.description}</span>
              </div>

              <strong>↗</strong>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
