import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { api } from "../api/client";


const severityKeys = new Set([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
]);

const statusKeys = new Set([
  "open",
  "acknowledged",
  "resolved",
]);


function severityLabel(value, t) {
  return severityKeys.has(value)
    ? t(`alerts.severity.${value}`)
    : value;
}


function statusLabel(value, t) {
  return statusKeys.has(value)
    ? t(`alerts.status.${value}`)
    : value;
}


function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


function formatDate(value, language) {
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
    year: "numeric",
    hour: "2-digit",
      minute: "2-digit",
    },
  );
}


export default function AlertsPage() {
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [component, setComponent] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");


  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 500,
      };

      if (status) {
        params.status = status;
      }

      if (severity) {
        params.severity = severity;
      }

      if (component) {
        params.component = component;
      }

      const [
        summaryResponse,
        alertsResponse,
      ] = await Promise.all([
        api.getSecurityAlertSummary(),
        api.getSecurityAlerts(params),
      ]);

      setSummary(summaryResponse);
      setAlerts(alertsResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        t("alerts.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [status, severity, component, t]);


  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);


  async function changeAlertStatus(id, action) {
    setActionId(id);
    setError("");

    try {
      if (action === "acknowledge") {
        await api.acknowledgeSecurityAlert(id);
      } else {
        await api.resolveSecurityAlert(id);
      }

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message ||
        t("alerts.errors.update"),
      );
    } finally {
      setActionId(null);
    }
  }


  return (
    <section className="security-page alerts-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {t("alerts.eyebrow")}
          </p>

          <h1>{t("alerts.title")}</h1>

          <p className="subtitle">
            {t("alerts.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadAlerts}
        >
          {loading
            ? t("alerts.refreshing")
            : t("alerts.refresh")}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            {t("alerts.errors.heading")}
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid alert-metrics">
        <article className="metric-card">
          <span>{t("alerts.kpi.total")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.total ?? 0}
          </strong>
          <p>{t("alerts.kpi.totalDescription")}</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>{t("alerts.kpi.open")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.open ?? 0}
          </strong>
          <p>{t("alerts.kpi.openDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("alerts.kpi.acknowledged")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.acknowledged ?? 0}
          </strong>
          <p>{t("alerts.kpi.acknowledgedDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("alerts.kpi.resolved")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.resolved ?? 0}
          </strong>
          <p>{t("alerts.kpi.resolvedDescription")}</p>
        </article>

        <article className="metric-card metric-card--danger">
          <span>{t("alerts.kpi.criticalActive")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.critical_active ?? 0}
          </strong>
          <p>{t("alerts.kpi.criticalActiveDescription")}</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>{t("alerts.kpi.highActive")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.high_active ?? 0}
          </strong>
          <p>{t("alerts.kpi.highActiveDescription")}</p>
        </article>
      </div>

      <section className="panel alerts-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              {t("alerts.inventory.eyebrow")}
            </p>

            <h2>{t("alerts.inventory.title")}</h2>

            <p>
              {t("alerts.inventory.description")}
            </p>
          </div>

          <span className="security-event-count">
            {t(
              "alerts.inventory.results",
              { count: alerts.length },
            )}
          </span>
        </div>

        <div className="vulnerability-filters">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">
              {t("alerts.filters.allStatuses")}
            </option>
            <option value="open">
              {statusLabel("open", t)}
            </option>
            <option value="acknowledged">
              {statusLabel("acknowledged", t)}
            </option>
            <option value="resolved">
              {statusLabel("resolved", t)}
            </option>
          </select>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <option value="">
              {t("alerts.filters.allSeverities")}
            </option>
            <option value="CRITICAL">
              {severityLabel("CRITICAL", t)}
            </option>
            <option value="HIGH">
              {severityLabel("HIGH", t)}
            </option>
            <option value="MEDIUM">
              {severityLabel("MEDIUM", t)}
            </option>
            <option value="LOW">
              {severityLabel("LOW", t)}
            </option>
          </select>

          <select
            value={component}
            onChange={(event) =>
              setComponent(event.target.value)
            }
          >
            <option value="">
              {t("alerts.filters.allComponents")}
            </option>
            <option value="backend">
              {t("alerts.filters.backend")}
            </option>
            <option value="frontend">
              {t("alerts.filters.frontend")}
            </option>
          </select>
        </div>

        <p className="vulnerability-scan-date">
          {t("alerts.inventory.lastActivity")}{" "}
          <strong>
            {formatDate(
              summary?.last_seen_at,
              language,
            )}
          </strong>
        </p>
        {loading ? (
          <div className="security-empty">
            {t("alerts.inventory.loading")}
          </div>
        ) : alerts.length === 0 ? (
          <div className="security-empty">
            <strong>
              {t("alerts.inventory.empty")}
            </strong>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table className="security-table alert-table">
              <thead>
                <tr>
                  <th>{t("alerts.table.severity")}</th>
                  <th>{t("alerts.table.alert")}</th>
                  <th>{t("alerts.table.component")}</th>
                  <th>{t("alerts.table.package")}</th>
                  <th>{t("alerts.table.status")}</th>
                  <th>{t("alerts.table.lastSeen")}</th>
                  <th>{t("alerts.table.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span
                        className={
                          `security-severity ` +
                          `security-severity--${alert.severity.toLowerCase()}`
                        }
                      >
                        {severityLabel(
                          alert.severity,
                          t,
                        )}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {alert.vulnerability_id ||
                          alert.title}
                      </strong>

                      <span className="security-event-description">
                        {alert.title}
                      </span>
                    </td>

                    <td>
                      {alert.component || "—"}
                    </td>

                    <td>
                      {alert.package_name || "—"}
                    </td>

                    <td>
                      <span
                        className={
                          `security-alert-status ` +
                          `security-alert-status--${alert.status}`
                        }
                      >
                        {statusLabel(
                          alert.status,
                          t,
                        )}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        alert.last_seen_at,
                        language,
                      )}
                    </td>

                    <td>
                      <div className="security-alert-actions">
                        {alert.status === "open" && (
                          <button
                            type="button"
                            className="security-alert-action"
                            disabled={actionId === alert.id}
                            onClick={() =>
                              changeAlertStatus(
                                alert.id,
                                "acknowledge",
                              )
                            }
                          >
                            {t("alerts.actions.acknowledge")}
                          </button>
                        )}

                        {alert.status !== "resolved" && (
                          <button
                            type="button"
                            className="security-alert-action security-alert-action--resolve"
                            disabled={actionId === alert.id}
                            onClick={() =>
                              changeAlertStatus(
                                alert.id,
                                "resolve",
                              )
                            }
                          >
                            {t("alerts.actions.resolve")}
                          </button>
                        )}

                        {alert.status === "resolved" && (
                          <span className="security-alert-no-action">
                            {t("alerts.actions.none")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
