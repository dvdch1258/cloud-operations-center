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


function severityLabel(value, t) {
  return severityKeys.has(value)
    ? t(`vulnerabilities.severity.${value}`)
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


export default function VulnerabilitiesPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  const [summary, setSummary] = useState(null);
  const [findings, setFindings] = useState([]);
  const [component, setComponent] = useState("");
  const [severity, setSeverity] = useState("");
  const [fixAvailable, setFixAvailable] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadVulnerabilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 500,
      };

      if (component) {
        params.component = component;
      }

      if (severity) {
        params.severity = severity;
      }

      if (fixAvailable === "true") {
        params.fixAvailable = true;
      }

      if (fixAvailable === "false") {
        params.fixAvailable = false;
      }

      const [
        summaryResponse,
        findingsResponse,
      ] = await Promise.all([
        api.getVulnerabilitySummary(),
        api.getVulnerabilities(params),
      ]);

      setSummary(summaryResponse);
      setFindings(findingsResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        t("vulnerabilities.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [
    component,
    severity,
    fixAvailable,
    t,
  ]);


  useEffect(() => {
    loadVulnerabilities();
  }, [loadVulnerabilities]);


  return (
    <section className="security-page vulnerabilities-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {t("vulnerabilities.eyebrow")}
          </p>

          <h1>{t("vulnerabilities.title")}</h1>

          <p className="subtitle">
            {t("vulnerabilities.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadVulnerabilities}
        >
          {loading
            ? t("vulnerabilities.refreshing")
            : t("vulnerabilities.refresh")}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            {t("vulnerabilities.errors.heading")}
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid vulnerability-metrics">
        <article className="metric-card">
          <span>{t("vulnerabilities.kpi.total")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.total_findings ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.totalDescription")}</p>
        </article>

        <article className="metric-card metric-card--danger">
          <span>{t("vulnerabilities.kpi.critical")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.critical ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.criticalDescription")}</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>{t("vulnerabilities.kpi.high")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.high ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.highDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("vulnerabilities.kpi.medium")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.medium ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.mediumDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("vulnerabilities.kpi.low")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.low ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.lowDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("vulnerabilities.kpi.fixAvailable")}</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.fix_available ?? 0}
          </strong>
          <p>{t("vulnerabilities.kpi.fixAvailableDescription")}</p>
        </article>
      </div>

      <section className="panel vulnerability-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              {t("vulnerabilities.inventory.eyebrow")}
            </p>

            <h2>{t("vulnerabilities.inventory.title")}</h2>

            <p>
              {t("vulnerabilities.inventory.description")}
            </p>
          </div>

          <span className="security-event-count">
            {t(
              "vulnerabilities.inventory.results",
              { count: findings.length },
            )}
          </span>
        </div>

        <div className="vulnerability-filters">
          <select
            value={component}
            onChange={(event) =>
              setComponent(event.target.value)
            }
          >
            <option value="">
              {t("vulnerabilities.filters.allComponents")}
            </option>
            <option value="backend">
              {t("vulnerabilities.filters.backend")}
            </option>
            <option value="frontend">
              {t("vulnerabilities.filters.frontend")}
            </option>
          </select>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <option value="">
              {t("vulnerabilities.filters.allSeverities")}
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
            <option value="UNKNOWN">
              {severityLabel("UNKNOWN", t)}
            </option>
          </select>

          <select
            value={fixAvailable}
            onChange={(event) =>
              setFixAvailable(event.target.value)
            }
          >
            <option value="">
              {t("vulnerabilities.filters.anyFixStatus")}
            </option>
            <option value="true">
              {t("vulnerabilities.filters.fixAvailable")}
            </option>
            <option value="false">
              {t("vulnerabilities.filters.noFixAvailable")}
            </option>
          </select>
        </div>

        <p className="vulnerability-scan-date">
          {t("vulnerabilities.inventory.lastScan")}{" "}
          <strong>
            {formatDate(
              summary?.last_scanned_at,
              language,
            )}
          </strong>
        </p>

        {loading ? (
          <div className="security-empty">
            {t("vulnerabilities.inventory.loading")}
          </div>
        ) : findings.length === 0 ? (
          <div className="security-empty">
            <strong>
              {t("vulnerabilities.inventory.empty")}
            </strong>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table className="security-table vulnerability-table">
              <thead>
                <tr>
                  <th>{t("vulnerabilities.table.severity")}</th>
                  <th>{t("vulnerabilities.table.cve")}</th>
                  <th>{t("vulnerabilities.table.component")}</th>
                  <th>{t("vulnerabilities.table.package")}</th>
                  <th>{t("vulnerabilities.table.installedVersion")}</th>
                  <th>{t("vulnerabilities.table.fix")}</th>
                  <th>{t("vulnerabilities.table.status")}</th>
                </tr>
              </thead>

              <tbody>
                {findings.map((finding) => (
                  <tr key={finding.id}>
                    <td>
                      <span
                        className={
                          `security-severity ` +
                          `security-severity--${finding.severity.toLowerCase()}`
                        }
                      >
                        {severityLabel(
                          finding.severity,
                          t,
                        )}
                      </span>
                    </td>

                    <td>
                      {finding.primary_url ? (
                        <a
                          className="vulnerability-cve"
                          href={finding.primary_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {finding.vulnerability_id}
                        </a>
                      ) : (
                        <strong>
                          {finding.vulnerability_id}
                        </strong>
                      )}
                    </td>

                    <td>
                      <span className="environment-badge">
                        {finding.component}
                      </span>
                    </td>

                    <td>
                      <strong>{finding.package_name}</strong>
                    </td>

                    <td className="security-ip">
                      {finding.installed_version || "—"}
                    </td>

                    <td className="security-ip">
                      {finding.fixed_version ? (
                        <span className="vulnerability-fix">
                          {finding.fixed_version}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      {finding.trivy_status || "—"}
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
