import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

const statusLabels = {
  up: "Operativo",
  down: "Caído",
  unknown: "Desconocido",
};

function formatLatency(value) {
  if (value == null) {
    return "—";
  }

  return `${Number(value).toFixed(1)} ms`;
}

function formatUptime(value) {
  if (value == null) {
    return "Sin datos";
  }

  return `${Number(value).toFixed(2)} %`;
}

function LatencyChart({ checks }) {
  const points = useMemo(() => {
    return [...checks]
      .filter(
        (check) =>
          check.response_time_ms != null
      )
      .reverse();
  }, [checks]);

  if (points.length < 2) {
    return (
      <div className="chart-empty">
        Aún no hay suficientes comprobaciones para mostrar
        una tendencia.
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const paddingX = 20;
  const paddingY = 22;

  const maxLatency = Math.max(
    ...points.map(
      (check) => Number(check.response_time_ms)
    ),
    1
  );

  const chartMax = maxLatency * 1.15;

  const coordinates = points.map((check, index) => {
    const x =
      paddingX +
      (index / (points.length - 1)) *
        (width - paddingX * 2);

    const y =
      height -
      paddingY -
      (Number(check.response_time_ms) / chartMax) *
        (height - paddingY * 2);

    return {
      x,
      y,
      check,
    };
  });

  const polyline = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  const latest = coordinates[coordinates.length - 1];

  return (
    <div className="latency-chart">
      <div className="latency-chart__scale">
        <span>{chartMax.toFixed(0)} ms</span>
        <span>0 ms</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Evolución de la latencia"
      >
        <line
          className="latency-chart__grid"
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
        />

        <line
          className="latency-chart__grid"
          x1={paddingX}
          y1={height / 2}
          x2={width - paddingX}
          y2={height / 2}
        />

        <line
          className="latency-chart__grid"
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
        />

        <polyline
          className="latency-chart__line"
          fill="none"
          points={polyline}
        />

        <circle
          className="latency-chart__point"
          cx={latest.x}
          cy={latest.y}
          r="5"
        />
      </svg>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams();

  const [service, setService] = useState(null);
  const [uptime1h, setUptime1h] = useState(null);
  const [uptime24h, setUptime24h] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        serviceData,
        uptime1hData,
        uptime24hData,
        checksData,
      ] = await Promise.all([
        api.getService(serviceId),
        api.getServiceUptime(serviceId, 1),
        api.getServiceUptime(serviceId, 24),
        api.getServiceChecks(serviceId, 60),
      ]);

      setService(serviceData);
      setUptime1h(uptime1hData);
      setUptime24h(uptime24hData);
      setChecks(checksData);
      setLastUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();

    const intervalId = window.setInterval(
      loadData,
      30000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  if (!service && loading) {
    return (
      <section className="panel">
        Cargando información del servicio...
      </section>
    );
  }

  if (!service) {
    return (
      <>
        <Link
          className="back-link"
          to="/servicios"
        >
          ← Volver a servicios
        </Link>

        <section className="alert alert--error">
          <strong>No se pudo cargar el servicio</strong>
          <span>{error}</span>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <div>
          <Link
            className="back-link"
            to="/servicios"
          >
            ← Servicios
          </Link>

          <p className="eyebrow">DETALLE OPERATIVO</p>

          <h1>{service.name}</h1>

          <p className="subtitle">
            {service.endpoint}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>

      {error && (
        <section className="alert alert--error">
          <strong>Error de actualización</strong>
          <span>{error}</span>
        </section>
      )}

      <section className="service-detail-status panel">
        <div>
          <span
            className={
              `status-badge ` +
              `status-badge--${service.status}`
            }
          >
            {statusLabels[service.status] ||
              service.status}
          </span>

          <strong>{service.type}</strong>
        </div>

        <span>
          {lastUpdatedAt
            ? `Actualizado ${lastUpdatedAt.toLocaleTimeString()}`
            : "Esperando datos"}
        </span>
      </section>

      <section className="service-detail-metrics">
        <article className="metric-card metric-card--success">
          <div className="metric-card__header">
            <span>Uptime 1 hora</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatUptime(uptime1h?.uptime_percent)}
          </strong>

          <p>
            {uptime1h?.checks_total ?? 0} comprobaciones
          </p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>Uptime 24 horas</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatUptime(uptime24h?.uptime_percent)}
          </strong>

          <p>
            {uptime24h?.checks_total ?? 0} comprobaciones disponibles
          </p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>Latencia media</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatLatency(
              uptime1h?.average_response_time_ms
            )}
          </strong>

          <p>Media durante la última hora</p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>Último check</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value metric-card__value--time">
            {uptime1h?.last_checked_at
              ? new Date(
                  uptime1h.last_checked_at
                ).toLocaleTimeString()
              : "—"}
          </strong>

          <p>Comprobación automática más reciente</p>
        </article>
      </section>

      <section className="panel detail-chart-panel">
        <div className="panel__header">
          <div>
            <h2>Evolución de latencia</h2>

            <span>
              Últimas {checks.length} comprobaciones
            </span>
          </div>

          <span>
            {checks[0]?.response_time_ms != null
              ? `Actual: ${formatLatency(
                  checks[0].response_time_ms
                )}`
              : "Sin datos"}
          </span>
        </div>

        <LatencyChart checks={checks} />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Histórico reciente</h2>
            <span>Últimas comprobaciones</span>
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Estado</th>
                <th>HTTP</th>
                <th>Latencia</th>
                <th>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {checks.slice(0, 15).map((check) => (
                <tr key={check.id}>
                  <td>
                    {new Date(
                      check.checked_at
                    ).toLocaleTimeString()}
                  </td>

                  <td>
                    <span
                      className={
                        `status-badge ` +
                        `status-badge--${check.status}`
                      }
                    >
                      {statusLabels[check.status] ||
                        check.status}
                    </span>
                  </td>

                  <td>
                    {check.status_code ?? "—"}
                  </td>

                  <td>
                    {formatLatency(
                      check.response_time_ms
                    )}
                  </td>

                  <td className="check-error-cell">
                    {check.error || "Sin errores"}
                  </td>
                </tr>
              ))}

              {!checks.length && (
                <tr>
                  <td colSpan="5">
                    Aún no existen comprobaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
