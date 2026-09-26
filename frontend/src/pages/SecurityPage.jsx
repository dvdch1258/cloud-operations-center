import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { Link } from "react-router-dom";

import { api } from "../api/client";

import "./SecurityPage.css";


const ALERT_STATUS_LABELS = {
  open: "security.activityUi.statusOpen",
  acknowledged: "security.activityUi.statusAcknowledged",
  resolved: "security.activityUi.statusResolved",
};


const SECURITY_AREAS = [
  {
    path: "/seguridad/vulnerabilidades",
    eyebrow: "security.activityUi.exposureEyebrow",
    title: "security.activityUi.exposureTitle",
    description: "security.activityUi.exposureDescription",
  },
  {
    path: "/seguridad/alertas",
    eyebrow: "security.activityUi.detectionEyebrow",
    title: "security.activityUi.detectionTitle",
    description: "security.activityUi.detectionDescription",
  },
  {
    path: "/seguridad/compliance",
    eyebrow: "security.activityUi.controlEyebrow",
    title: "security.activityUi.controlTitle",
    description: "security.activityUi.controlDescription",
  },
  {
    path: "/seguridad/policies",
    eyebrow: "security.activityUi.governanceEyebrow",
    title: "security.activityUi.governanceTitle",
    description: "security.activityUi.governanceDescription",
  },
];


function formatEventType(value, t) {
  if (!value) {
    return t("security.common.unknown");
  }

  return t(
    `security.events.${value}`,
    {
      defaultValue: value,
    },
  );
}

function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


function severityLabel(value, t) {
  const normalized =
    String(value || "unknown")
      .toLowerCase();

  return t(
    `security.severity.${normalized}`,
    {
      defaultValue:
        value ||
        t("security.common.unknown"),
    },
  );
}



function formatDate(value, language) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(localeForLanguage(language), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatFullDate(value, language, t) {
  if (!value) {
    return t("security.common.noData");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(localeForLanguage(language), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatRelative(value, t) {
  if (!value) {
    return t("security.finalUi.noActivity");
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return t("security.finalUi.unknownDate");
  }

  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 60000),
  );

  if (diffMinutes < 1) {
    return t("security.finalUi.now");
  }

  if (diffMinutes < 60) {
    return t("security.finalUi.minutesAgo", { count: diffMinutes });
  }

  const hours = Math.round(diffMinutes / 60);

  if (hours < 24) {
    return t("security.finalUi.hoursAgo", { count: hours });
  }

  const days = Math.round(hours / 24);

  return t("security.finalUi.daysAgo", { count: days });
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
      label: "security.stateUi.criticalLabel",
      description:
        "security.stateUi.criticalDescription",
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
      label: "security.stateUi.warningLabel",
      description:
        "security.stateUi.warningDescription",
    };
  }

  return {
    tone: "healthy",
    label: "security.stateUi.healthyLabel",
    description:
      "security.stateUi.healthyDescription",
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
  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage ||
    i18n.language;

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
        t("security.errors.load"),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);


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
            {t("security.page.eyebrow")}
          </p>

          <h1>
            {t("security.page.title")}
          </h1>

          <p className="subtitle">
            {t("security.page.subtitle")}
          </p>
        </div>

        <div className="security-v2__actions">
          <span className="security-v2__live">
            <i />
            {t("security.page.live")} {t("security.controlPlane.eyebrow")}
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
              ? t("security.page.refreshing")
              : t("security.page.refresh")}
          </button>
        </div>
      </header>


      {error && (
        <div className="alert alert--error">
          <strong>
            {t("security.page.errorHeading")}
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
              {t("security.state.kicker")}
            </span>

            <strong>
              {loading ? t("security.time.waiting") : t(securityState.label)}
            </strong>

            <p>
              {loading ? t("security.state.description") : t(securityState.description)}
            </p>
          </div>
        </div>

        <div className="security-v2__state-meta">
          <div>
            <span>{t("security.finalUi.lastScan")}</span>
            <strong>
              {loading
                ? "—"
                : formatRelative(data.vulnerability?.last_scanned_at, t)}
            </strong>
          </div>

          <div>
            <span>{t("security.state.lastAlert")}</span>
            <strong>
              {loading
                ? "—"
                : formatRelative(data.alertSummary?.last_seen_at, t)}
            </strong>
          </div>

          <span className="environment-badge">
            {t("security.state.environment")}
          </span>
        </div>
      </section>


      <div className="security-v2__hero-grid">
        <section className="security-v2__posture-card">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                {t("security.posture.eyebrow")}
              </p>
              <h2>
                {t("security.posture.title")}
              </h2>
            </div>

            <span className="security-v2__micro-badge">
              {t("security.posture.badge")}
            </span>
          </div>

          <div className="security-v2__posture-body">
            <div className="security-v2__ring">
              <svg
                viewBox="0 0 120 120"
                role="img"
                aria-label={t("security.finalUi.complianceScore", { score: complianceScore })}
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
                <span>{t("security.sections.compliance.title")}</span>
              </div>
            </div>

            <div className="security-v2__posture-stats">
              <div>
                <span>{t("security.finalUi.passedControls")}</span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.passed ?? 0}
                </strong>
              </div>

              <div>
                <span>{t("security.finalUi.failedControls")}</span>
                <strong>
                  {loading
                    ? "—"
                    : data.compliance?.failed ?? 0}
                </strong>
              </div>

              <div>
                <span>{t("security.finalUi.totalControls")}</span>
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
              {t("security.finalUi.lastEvaluation")}
            </span>

            <strong>
              {loading
                ? "—"
                : formatFullDate(data.compliance?.evaluated_at, language, t)}
            </strong>
          </div>
        </section>


        <section className="security-v2__radar-card">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                {t("security.radar.eyebrow")}
              </p>
              <h2>
                {t("security.radar.title")}
              </h2>
            </div>

            <span className="security-v2__signal-status">
              {t("security.radar.status")}
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
                  {t("security.posture.stats.critical")}
                </span>
                <strong>
                  {loading
                    ? "—"
                    : data.vulnerability?.critical ?? 0}
                </strong>
              </article>

              <article>
                <span>
                  {t("security.metrics.activeAlerts")}
                </span>
                <strong>
                  {loading ? "—" : activeAlerts}
                </strong>
              </article>

              <article>
                <span>
                  {t("security.finalUi.lockedAccounts")}
                </span>
                <strong>
                  {loading
                    ? "—"
                    : data.summary?.locked_users ?? 0}
                </strong>
              </article>

              <article>
                <span>
                  {t("security.finalUi.failedControls")}
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
          label={t("security.metrics.events24h")}
          value={
            loading
              ? "—"
              : data.summary?.events_last_24h ?? 0
          }
          detail={t("security.metrics.authenticationActivity")}
        />

        <Metric
          label={t("security.metrics.failedLogins24h")}
          value={
            loading
              ? "—"
              : data.summary?.failed_logins_last_24h ?? 0
          }
          detail={t("security.metrics.failedAuthenticationAttempts")}
          tone={
            Number(
              data.summary?.failed_logins_last_24h || 0,
            ) > 0
              ? "warning"
              : "neutral"
          }
        />

        <Metric
          label={t("security.metrics.activeAlerts")}
          value={loading ? "—" : activeAlerts}
          detail={t("security.metrics.openOrAcknowledged")}
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
          label={t("security.metrics.highCritical")}
          value={loading ? "—" : highRiskFindings}
          detail={t("security.metrics.highestSeverityFindings")}
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
                {t("security.exposure.eyebrow")}
              </p>
              <h2>{t("security.exposure.title")}</h2>
              <p>
                {t("security.exposure.description")}
              </p>
            </div>

            <Link
              className="security-v2__text-link"
              to="/seguridad/vulnerabilidades"
            >
              {t("security.exposure.viewFindings")}
            </Link>
          </div>

          <div className="security-v2__exposure-total">
            <div>
              <span>{t("security.exposure.totalFindings")}</span>
              <strong>
                {loading
                  ? "—"
                  : vulnerabilityTotal}
              </strong>
            </div>

            <div>
              <span>{t("security.exposure.fixAvailable")}</span>
              <strong>
                {loading
                  ? "—"
                  : data.vulnerability?.fix_available ?? 0}
              </strong>
            </div>

            <div>
              <span>{t("security.exposure.components")}</span>
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
                t("security.severity.critical"),
                data.vulnerability?.critical,
              ],
              [
                "high",
                t("security.severity.high"),
                data.vulnerability?.high,
              ],
              [
                "medium",
                t("security.severity.medium"),
                data.vulnerability?.medium,
              ],
              [
                "low",
                t("security.severity.low"),
                data.vulnerability?.low,
              ],
              [
                "unknown",
                t("security.severity.unknown"),
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
              {t("security.exposure.lastScan")}
            </span>

            <strong>
              {loading
                ? "—"
                : formatFullDate(data.vulnerability?.last_scanned_at, language, t)}
            </strong>
          </div>
        </section>


        <section className="security-v2__panel security-v2__control-plane">
          <div className="security-v2__section-heading">
            <div>
              <p className="eyebrow">
                {t("security.controlPlane.eyebrow")}
              </p>
              <h2>{t("security.controlPlane.title")}</h2>
              <p>
                {t("security.controlPlane.description")}
              </p>
            </div>
          </div>

          <div className="security-v2__control-grid">
            <Link
              to="/seguridad/compliance"
              className="security-v2__control-card"
            >
              <div>
                <span>{t("security.sections.compliance.title")}</span>
                <strong>
                  {loading
                    ? "—"
                    : `${complianceScore}%`}
                </strong>
              </div>

              <p>
                {loading
                  ? t("security.controlPlane.evaluating")
                  : t("security.controlPlane.complianceSummary", {
                        passed: data.compliance?.passed ?? 0,
                        failed: data.compliance?.failed ?? 0,
                      })}
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
                <span>{t("security.sections.policies.title")}</span>
                <strong>
                  {loading
                    ? "—"
                    : data.policies?.total ?? 0}
                </strong>
              </div>

              <p>
                {loading
                  ? t("security.controlPlane.loadingPolicies")
                  : t("security.controlPlane.policySummary", {
                        enforced: data.policies?.enforced ?? 0,
                        enabled: data.policies?.enabled ?? 0,
                      })}
              </p>

              <span className="security-v2__control-arrow">
                ↗
              </span>
            </Link>
          </div>

          <div className="security-v2__control-preview">
            <div className="security-v2__control-preview-head">
              <span>{t("security.controlPlane.controlStatus")}</span>
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
                {t("security.activityUi.alertsEyebrow")}
              </p>
              <h2>{t("security.activityUi.alertsTitle")}</h2>
              <p>
                {t("security.activityUi.alertsDescription")}
              </p>
            </div>

            <Link
              className="security-v2__text-link"
              to="/seguridad/alertas"
            >
              {t("security.activityUi.viewAlerts")}
            </Link>
          </div>

          <div className="security-v2__alert-list">
            {loading ? (
              <div className="security-v2__empty">
                {t("security.activityUi.loadingAlerts")}
              </div>
            ) : data.alerts.length === 0 ? (
              <div className="security-v2__empty">
                <strong>
                  {t("security.activityUi.noAlerts")}
                </strong>
                <span>
                  {t("security.activityUi.noAlertsHint")}
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
                        {t(ALERT_STATUS_LABELS[alert.status] || "security.common.unknown", { defaultValue: alert.status || t("security.common.unknown") })}
                      </span>
                    </div>

                    <p>
                      {alert.component ||
                        alert.category ||
                        t("security.activityUi.security")}
                      {" · "}
                      {severityLabel(alert.severity, t) ||
                        alert.severity}
                    </p>
                  </div>

                  <time>
                    {formatRelative(alert.last_seen_at, t)}
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
                {t("security.activityUi.activityEyebrow")}
              </p>
              <h2>{t("security.activityUi.activityTitle")}</h2>
              <p>
                {t("security.activityUi.activityDescription")}
              </p>
            </div>

            <span className="security-v2__micro-badge">
              {t("security.activityUi.eventCount", { count: data.events.length })}
            </span>
          </div>

          <div className="security-v2__timeline">
            {loading ? (
              <div className="security-v2__empty">
                {t("security.activityUi.loadingActivity")}
              </div>
            ) : data.events.length === 0 ? (
              <div className="security-v2__empty">
                <strong>
                  {t("security.activityUi.noEvents")}
                </strong>
                <span>
                  {t("security.activityUi.noEventsHint")}
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
                          event.event_type, t
                        )}
                      </strong>

                      <time>
                        {formatDate(event.created_at, language)}
                      </time>
                    </div>

                    <p>{event.description}</p>

                    <span>
                      {event.username || t("security.activityUi.system")}
                      {" · "}
                      {event.ip_address || t("security.activityUi.ipUnavailable")}
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
              {t("security.activityUi.workspaceEyebrow")}
            </p>

            <h2>{t("security.activityUi.workspaceTitle")}</h2>
          </div>

          <p>
            {t("security.activityUi.workspaceDescription")}
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
                <p>{t(area.eyebrow)}</p>
                <h3>{t(area.title)}</h3>
                <span>{t(area.description)}</span>
              </div>

              <strong>↗</strong>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
