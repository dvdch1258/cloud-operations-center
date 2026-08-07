import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const initialSummary = {
  services_total: 0,
  services_up: 0,
  services_down: 0,
  incidents_open: 0,
};

function MetricCard({ title, value, description, status }) {
  return (
    <article className={`metric-card metric-card--${status}`}>
      <div className="metric-card__header">
        <span>{title}</span>
        <span className="metric-card__indicator" />
      </div>

      <strong className="metric-card__value">{value}</strong>
      <p>{description}</p>
    </article>
  );
}

export default function SummaryPage() {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSummary = useCallback(async () => {
    setError("");

    try {
      const data = await api.getSummary();
      setSummary(data);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();

    const interval = window.setInterval(loadSummary, 30000);
    return () => window.clearInterval(interval);
  }, [loadSummary]);

  const operational =
    !error &&
    summary.services_down === 0 &&
    summary.incidents_open === 0;

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">OPERACIONES</p>
          <h1>Resumen de la plataforma</h1>
          <p className="subtitle">
            Estado general de servicios e incidentes.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadSummary}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error && (
        <section className="alert alert--error">
          <strong>No se pudo obtener el resumen</strong>
          <span>{error}</span>
        </section>
      )}

      <section className="platform-status">
        <div>
          <span
            className={
              operational
                ? "status-dot status-dot--up"
                : "status-dot status-dot--down"
            }
          />

          <div>
            <strong>
              {operational
                ? "Plataforma operativa"
                : "Plataforma con incidencias"}
            </strong>

            <p>
              {lastUpdated
                ? `Última actualización: ${lastUpdated.toLocaleTimeString()}`
                : "Esperando datos"}
            </p>
          </div>
        </div>

        <span className="environment-badge">
          Kubernetes · cloud-ops
        </span>
      </section>

      <section className="metrics-grid">
        <MetricCard
          title="Servicios totales"
          value={summary.services_total}
          description="Servicios registrados"
          status="neutral"
        />

        <MetricCard
          title="Servicios operativos"
          value={summary.services_up}
          description="Funcionando correctamente"
          status="success"
        />

        <MetricCard
          title="Servicios caídos"
          value={summary.services_down}
          description="Requieren atención"
          status={summary.services_down ? "danger" : "success"}
        />

        <MetricCard
          title="Incidentes abiertos"
          value={summary.incidents_open}
          description="Pendientes de resolución"
          status={summary.incidents_open ? "warning" : "success"}
        />
      </section>
    </>
  );
}
