import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


function formatUptime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "—";
  }

  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}


export default function ObservabilityPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.getObservabilitySummary();

      setSummary(response);
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo cargar la observabilidad.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadSummary();
  }, [loadSummary]);


  const healthy =
    summary?.status === "healthy";

  return (
    <section className="observability-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            PLATFORM TELEMETRY
          </p>

          <h1>Observabilidad</h1>

          <p className="subtitle">
            Rendimiento y telemetría en tiempo real
            de Cloud Operations Center.
          </p>
        </div>

        <div className="observability-actions">
          <button
            type="button"
            className="refresh-button"
            disabled={loading}
            onClick={loadSummary}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <a
            className="observability-grafana-link"
            href="https://grafana.cloudopscenter.es"
            target="_blank"
            rel="noreferrer"
          >
            Abrir Grafana ↗
          </a>
        </div>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            Observability API no disponible
          </strong>
          <span>{error}</span>
        </div>
      )}

      <section
        className={
          "panel observability-health " +
          (
            healthy
              ? "observability-health--healthy"
              : "observability-health--degraded"
          )
        }
      >
        <div>
          <p className="eyebrow">
            PLATFORM STATUS
          </p>

          <div className="observability-health__status">
            <span
              className={
                "observability-health__dot " +
                (
                  healthy
                    ? "observability-health__dot--healthy"
                    : "observability-health__dot--degraded"
                )
              }
            />

            <strong>
              {loading
                ? "Evaluando..."
                : healthy
                  ? "Sistema saludable"
                  : "Sistema degradado"}
            </strong>
          </div>

          <p>
            Estado calculado a partir de latencia,
            errores y telemetría del backend.
          </p>
        </div>

        <span className="observability-source">
          Prometheus ·{" "}
          {summary?.prometheus_status === "up"
            ? "Connected"
            : "Unavailable"}
        </span>
      </section>

      <section className="metrics-grid observability-metrics">
        <article className="metric-card">
          <span>Requests / s</span>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : Number(
                  summary?.requests_per_second ?? 0
                ).toFixed(2)}
          </strong>

          <p>Media últimos 5 minutos</p>
        </article>

        <article className="metric-card">
          <span>Error rate</span>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : `${Number(
                  summary?.error_rate_percent ?? 0
                ).toFixed(2)}%`}
          </strong>

          <p>Respuestas HTTP 5xx</p>
        </article>

        <article className="metric-card">
          <span>Latencia p95</span>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : `${Number(
                  summary?.latency_p95_ms ?? 0
                ).toFixed(1)} ms`}
          </strong>

          <p>95 % de peticiones por debajo</p>
        </article>

        <article className="metric-card">
          <span>Backend uptime</span>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : formatUptime(
                  summary?.backend_uptime_seconds
                )}
          </strong>

          <p>Uptime del proceso actual</p>
        </article>
      </section>

      <section className="observability-preview-grid">
        <article className="panel observability-preview">
          <div className="security-panel-header">
            <div>
              <p className="eyebrow">
                REQUEST TRAFFIC
              </p>

              <h2>Peticiones</h2>
            </div>

            <span>5 min</span>
          </div>

          <div className="observability-chart-placeholder">
            <span>Gráfica Prometheus</span>
            <strong>
              Próximo paso: serie temporal
            </strong>
          </div>
        </article>

        <article className="panel observability-preview">
          <div className="security-panel-header">
            <div>
              <p className="eyebrow">
                RESPONSE TIME
              </p>

              <h2>Latencia</h2>
            </div>

            <span>p95</span>
          </div>

          <div className="observability-chart-placeholder">
            <span>Gráfica Prometheus</span>
            <strong>
              Próximo paso: serie temporal
            </strong>
          </div>
        </article>
      </section>
    </section>
  );
}
