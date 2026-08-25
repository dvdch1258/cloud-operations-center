import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const SEVERITY_LABELS = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
  UNKNOWN: "Desconocida",
};


function formatDate(value) {
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


export default function VulnerabilitiesPage() {
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
        "No se pudieron cargar las vulnerabilidades.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    component,
    severity,
    fixAvailable,
  ]);


  useEffect(() => {
    loadVulnerabilities();
  }, [loadVulnerabilities]);


  return (
    <section className="security-page vulnerabilities-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            SECURITY OPERATIONS
          </p>

          <h1>Vulnerabilidades</h1>

          <p className="subtitle">
            Hallazgos detectados por Trivy en las
            imágenes desplegadas de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadVulnerabilities}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudieron cargar las vulnerabilidades
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid vulnerability-metrics">
        <article className="metric-card">
          <span>Total hallazgos</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.total_findings ?? 0}
          </strong>
          <p>Último escaneo por componente</p>
        </article>

        <article className="metric-card metric-card--danger">
          <span>Críticas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.critical ?? 0}
          </strong>
          <p>Prioridad inmediata</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>Altas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.high ?? 0}
          </strong>
          <p>Riesgo elevado</p>
        </article>

        <article className="metric-card">
          <span>Medias</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.medium ?? 0}
          </strong>
          <p>Revisión recomendada</p>
        </article>

        <article className="metric-card">
          <span>Bajas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.low ?? 0}
          </strong>
          <p>Impacto reducido</p>
        </article>

        <article className="metric-card">
          <span>Con solución</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.fix_available ?? 0}
          </strong>
          <p>Versión corregida disponible</p>
        </article>
      </div>

      <section className="panel vulnerability-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              CONTAINER SECURITY
            </p>

            <h2>Hallazgos detectados</h2>

            <p>
              Último análisis disponible de backend
              y frontend.
            </p>
          </div>

          <span className="security-event-count">
            {findings.length} resultados
          </span>
        </div>

        <div className="vulnerability-filters">
          <select
            value={component}
            onChange={(event) =>
              setComponent(event.target.value)
            }
          >
            <option value="">Todos los componentes</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
          </select>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <option value="">Todas las severidades</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
            <option value="UNKNOWN">Desconocida</option>
          </select>

          <select
            value={fixAvailable}
            onChange={(event) =>
              setFixAvailable(event.target.value)
            }
          >
            <option value="">Cualquier estado</option>
            <option value="true">
              Con corrección disponible
            </option>
            <option value="false">
              Sin corrección disponible
            </option>
          </select>
        </div>

        <p className="vulnerability-scan-date">
          Último escaneo:{" "}
          <strong>
            {formatDate(summary?.last_scanned_at)}
          </strong>
        </p>

        {loading ? (
          <div className="security-empty">
            Cargando vulnerabilidades...
          </div>
        ) : findings.length === 0 ? (
          <div className="security-empty">
            <strong>
              No hay vulnerabilidades para estos filtros
            </strong>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table className="security-table vulnerability-table">
              <thead>
                <tr>
                  <th>Severidad</th>
                  <th>CVE</th>
                  <th>Componente</th>
                  <th>Paquete</th>
                  <th>Versión instalada</th>
                  <th>Corrección</th>
                  <th>Estado</th>
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
                        {SEVERITY_LABELS[finding.severity] ||
                          finding.severity}
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
