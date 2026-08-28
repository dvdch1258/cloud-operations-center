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


function formatLogTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(
    "es-ES",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}




function getSpanTimelineStyle(
  span,
  trace,
) {
  const traceStart =
    new Date(trace?.started_at).getTime();

  const spanStart =
    new Date(span?.started_at).getTime();

  const traceDuration =
    Number(trace?.duration_ms ?? 0);

  const spanDuration =
    Number(span?.duration_ms ?? 0);

  if (
    !Number.isFinite(traceStart) ||
    !Number.isFinite(spanStart) ||
    !Number.isFinite(traceDuration) ||
    traceDuration <= 0
  ) {
    return {
      left: "0%",
      width: "3%",
    };
  }

  const offsetMs =
    Math.max(
      0,
      spanStart - traceStart,
    );

  const left =
    Math.min(
      96,
      (offsetMs / traceDuration) * 100,
    );

  const remaining =
    Math.max(
      2,
      100 - left,
    );

  const width =
    Math.max(
      2,
      Math.min(
        remaining,
        (spanDuration / traceDuration) * 100,
      ),
    );

  return {
    left: `${left}%`,
    width: `${width}%`,
  };
}



function TimeseriesChart({
  points,
  suffix,
}) {
  if (!points?.length) {
    return (
      <div className="observability-chart-empty">
        Sin datos para este periodo.
      </div>
    );
  }

  const width = 640;
  const height = 190;
  const padding = 18;

  const values = points.map(
    (point) => Number(point.value)
  );

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const coordinates = points.map(
    (point, index) => {
      const x =
        padding +
        (
          index /
          Math.max(points.length - 1, 1)
        ) *
          usableWidth;

      const y =
        padding +
        (
          1 -
          (Number(point.value) - min) /
            (max - min)
        ) *
          usableHeight;

      return `${x},${y}`;
    }
  );

  const latest = values[values.length - 1];

  return (
    <div className="observability-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Serie temporal de la última hora"
        preserveAspectRatio="none"
      >
        <line
          className="observability-chart__grid"
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
        />

        <polyline
          className="observability-chart__line"
          points={coordinates.join(" ")}
        />
      </svg>

      <div className="observability-chart__footer">
        <span>Hace 1 h</span>

        <strong>
          {latest.toFixed(
            suffix === "ms" ? 1 : 2
          )}{" "}
          {suffix}
        </strong>

        <span>Ahora</span>
      </div>
    </div>
  );
}


export default function ObservabilityPage() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const [logFilters, setLogFilters] = useState({
    service: "",
    level: "",
    hours: "1",
    search: "",
  });


  const [traces, setTraces] = useState(null);
  const [tracesLoading, setTracesLoading] = useState(false);
  const [tracesError, setTracesError] = useState("");

  const [
    selectedTrace,
    setSelectedTrace,
  ] = useState(null);

  const [
    traceDetailLoading,
    setTraceDetailLoading,
  ] = useState(false);

  const [
    traceDetailError,
    setTraceDetailError,
  ] = useState("");


  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summaryResponse,
        timeseriesResponse,
        servicesResponse,
      ] = await Promise.all([
        api.getObservabilitySummary(),
        api.getObservabilityTimeseries(),
        api.getObservabilityServices(),
      ]);

      setSummary(summaryResponse);
      setTimeseries(timeseriesResponse);
      setServices(servicesResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo cargar la observabilidad.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  const loadLogs = useCallback(
    async (filters) => {
      setLogsLoading(true);
      setLogsError("");

      try {
        const response =
          await api.getObservabilityLogs({
            hours: Number(filters.hours),
            service:
              filters.service || undefined,
            level:
              filters.level || undefined,
            search:
              filters.search.trim() || undefined,
            limit: 100,
          });

        setLogs(response);
      } catch (requestError) {
        setLogsError(
          requestError.message ||
            "No se pudieron cargar los logs.",
        );
      } finally {
        setLogsLoading(false);
      }
    },
    [],
  );


  const loadTraces = useCallback(
    async () => {
      setTracesLoading(true);
      setTracesError("");

      try {
        const response =
          await api.getObservabilityTraces({
            hours: 1,
            limit: 12,
          });

        setTraces(response);
      } catch (requestError) {
        setTracesError(
          requestError.message ||
            "No se pudieron cargar las trazas.",
        );
      } finally {
        setTracesLoading(false);
      }
    },
    [],
  );


  const loadTraceDetail = useCallback(
    async (traceId) => {
      setTraceDetailLoading(true);
      setTraceDetailError("");

      try {
        const response =
          await api.getObservabilityTrace(
            traceId,
          );

        setSelectedTrace(response);
      } catch (requestError) {
        setSelectedTrace(null);

        setTraceDetailError(
          requestError.message ||
            "No se pudo cargar la traza.",
        );
      } finally {
        setTraceDetailLoading(false);
      }
    },
    [],
  );


  useEffect(() => {
    loadSummary();

    loadLogs({
      service: "",
      level: "",
      hours: "1",
      search: "",
    });

    loadTraces();
  }, [
    loadSummary,
    loadLogs,
    loadTraces,
  ]);


  const handleLogFilterChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setLogFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleLogSubmit = (event) => {
    event.preventDefault();
    loadLogs(logFilters);
  };


  const handleOpenTrace = async (
    traceId,
  ) => {
    await loadTraceDetail(traceId);

    document
      .getElementById(
        "observability-traces",
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };


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

          <TimeseriesChart
            points={timeseries?.requests_per_second}
            suffix="req/s"
          />
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

          <TimeseriesChart
            points={timeseries?.latency_p95_ms}
            suffix="ms"
          />
        </article>
      </section>

      <section className="panel observability-services-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              SERVICE HEALTH
            </p>

            <h2>Servicios</h2>

            <p>
              Estado, disponibilidad y latencia
              durante las últimas 24 horas.
            </p>
          </div>

          <div className="observability-services-summary">
            <span>
              <strong>{services?.up ?? 0}</strong>
              {" "}up
            </span>

            <span>
              <strong>{services?.down ?? 0}</strong>
              {" "}down
            </span>

            <span>
              <strong>{services?.total ?? 0}</strong>
              {" "}total
            </span>
          </div>
        </div>

        {loading ? (
          <div className="security-empty">
            Cargando servicios...
          </div>
        ) : !services?.services?.length ? (
          <div className="security-empty">
            No hay servicios monitorizados.
          </div>
        ) : (
          <div className="observability-services-table">
            <div className="observability-service-row observability-service-row--header">
              <span>Servicio</span>
              <span>Estado</span>
              <span>Uptime 24h</span>
              <span>Latencia</span>
              <span>HTTP</span>
            </div>

            {services.services.map((service) => {
              const isUp = service.status === "up";

              return (
                <div
                  key={service.id}
                  className="observability-service-row"
                >
                  <div className="observability-service-name">
                    <span
                      className={
                        "observability-service-dot " +
                        (
                          isUp
                            ? "observability-service-dot--up"
                            : "observability-service-dot--down"
                        )
                      }
                    />

                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.type}</span>
                    </div>
                  </div>

                  <span
                    className={
                      "observability-service-status " +
                      (
                        isUp
                          ? "observability-service-status--up"
                          : "observability-service-status--down"
                      )
                    }
                  >
                    {isUp ? "Healthy" : "Down"}
                  </span>

                  <strong>
                    {service.uptime_percent == null
                      ? "—"
                      : `${Number(
                          service.uptime_percent
                        ).toFixed(2)}%`}
                  </strong>

                  <span>
                    {service.last_response_time_ms == null
                      ? "—"
                      : `${Number(
                          service.last_response_time_ms
                        ).toFixed(1)} ms`}
                  </span>

                  <span>
                    {service.last_status_code ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      <section
        id="observability-traces"
        className="panel observability-traces-panel"
      >
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              DISTRIBUTED TRACING
            </p>

            <h2>Traces</h2>

            <p>
              Trazas recientes y spans recopilados
              mediante OpenTelemetry y Tempo.
            </p>
          </div>

          <div className="observability-traces-actions">
            <span className="observability-logs-count">
              <strong>
                {traces?.total ?? 0}
              </strong>
              {" "}traces
            </span>

            <button
              type="button"
              className="refresh-button"
              disabled={tracesLoading}
              onClick={loadTraces}
            >
              {tracesLoading
                ? "Actualizando..."
                : "Actualizar"}
            </button>
          </div>
        </div>

        {tracesError && (
          <div className="alert alert--error">
            <strong>Tempo no disponible</strong>
            <span>{tracesError}</span>
          </div>
        )}

        <div className="observability-traces-layout">
          <div className="observability-trace-list">
            <div className="observability-trace-list__header">
              <span>Operación</span>
              <span>Servicio</span>
              <span>Hora</span>
              <span>Duración</span>
              <span>Trace ID</span>
            </div>

            {tracesLoading && !traces ? (
              <div className="security-empty">
                Cargando trazas...
              </div>
            ) : !traces?.traces?.length ? (
              <div className="security-empty">
                No hay trazas para este periodo.
              </div>
            ) : (
              traces.traces.map((trace) => (
                <button
                  key={trace.trace_id}
                  type="button"
                  aria-pressed={
                    selectedTrace?.trace_id ===
                    trace.trace_id
                  }
                  className={
                    "observability-trace-row " +
                    (
                      selectedTrace?.trace_id ===
                      trace.trace_id
                        ? "observability-trace-row--active"
                        : ""
                    )
                  }
                  onClick={() =>
                    loadTraceDetail(
                      trace.trace_id,
                    )
                  }
                >
                  <strong className="observability-trace-row__operation">
                    {trace.operation}
                  </strong>

                  <span className="observability-trace-row__service">
                    {trace.service}
                  </span>

                  <time>
                    {formatLogTime(
                      trace.started_at,
                    )}
                  </time>

                  <span className="observability-trace-row__duration">
                    {Number(
                      trace.duration_ms ?? 0,
                    ).toFixed(3)} ms
                  </span>

                  <code className="observability-trace-row__id">
                    {trace.trace_id}
                  </code>
                </button>
              ))
            )}
          </div>

          <div className="observability-trace-detail">
            {traceDetailLoading ? (
              <div className="security-empty">
                Cargando detalle de traza...
              </div>
            ) : traceDetailError ? (
              <div className="alert alert--error">
                <strong>
                  Traza no disponible
                </strong>

                <span>
                  {traceDetailError}
                </span>
              </div>
            ) : !selectedTrace ? (
              <div className="security-empty">
                Selecciona una traza para
                inspeccionar sus spans.
              </div>
            ) : (
              <>
                <div className="observability-trace-detail__header">
                  <div>
                    <p className="eyebrow">
                      TRACE DETAIL
                    </p>

                    <h3>
                      {selectedTrace.operation}
                    </h3>

                    <code>
                      {selectedTrace.trace_id}
                    </code>
                  </div>

                  <span
                    className={
                      "observability-trace-status " +
                      `observability-trace-status--${selectedTrace.status}`
                    }
                  >
                    {selectedTrace.status}
                  </span>
                </div>

                <div className="observability-trace-summary">
                  <span>
                    <small>Servicio</small>
                    <strong>
                      {selectedTrace.service}
                    </strong>
                  </span>

                  <span>
                    <small>Duración</small>
                    <strong>
                      {Number(
                        selectedTrace.duration_ms ?? 0,
                      ).toFixed(3)} ms
                    </strong>
                  </span>

                  <span>
                    <small>Spans</small>
                    <strong>
                      {selectedTrace.spans_total}
                    </strong>
                  </span>

                  <span>
                    <small>Inicio</small>
                    <strong>
                      {formatLogTime(
                        selectedTrace.started_at,
                      )}
                    </strong>
                  </span>
                </div>

                <div className="observability-span-list">
                  {selectedTrace.spans?.map(
                    (span, index) => (
                      <article
                        key={
                          span.span_id ||
                          `${span.name}-${index}`
                        }
                        className={
                          "observability-span-row " +
                          (
                            span.parent_span_id
                              ? "observability-span-row--child"
                              : "observability-span-row--root"
                          )
                        }
                      >
                        <div className="observability-span-row__main">
                          <div>
                            <span className="observability-span-kind">
                              {span.kind
                                ?.replace(
                                  "SPAN_KIND_",
                                  "",
                                )
                                .toLowerCase()}
                            </span>

                            <strong>
                              {span.name}
                            </strong>
                          </div>

                          <span
                            className={
                              "observability-trace-status " +
                              `observability-trace-status--${span.status}`
                            }
                          >
                            {span.status}
                          </span>
                        </div>

                        <div className="observability-span-meta">
                          <span>
                            {Number(
                              span.duration_ms ?? 0,
                            ).toFixed(3)} ms
                          </span>

                          {span.http_method && (
                            <span>
                              {span.http_method}
                            </span>
                          )}

                          {span.http_target && (
                            <code>
                              {span.http_target}
                            </code>
                          )}

                          {span.http_status_code != null && (
                            <span>
                              HTTP{" "}
                              {span.http_status_code}
                            </span>
                          )}
                        </div>

                        <div className="observability-span-ids">
                          <code>
                            span {span.span_id}
                          </code>

                          {span.parent_span_id && (
                            <code>
                              parent{" "}
                              {span.parent_span_id}
                            </code>
                          )}
                        </div>

                        <div className="observability-span-timeline">
                          <span
                            className={
                              "observability-span-timeline__bar " +
                              `observability-span-timeline__bar--${span.status}`
                            }
                            style={
                              getSpanTimelineStyle(
                                span,
                                selectedTrace,
                              )
                            }
                          />
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="panel observability-logs-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              LIVE LOGS
            </p>

            <h2>Logs</h2>

            <p>
              Eventos recientes recopilados desde
              Kubernetes mediante Loki.
            </p>
          </div>

          <div className="observability-logs-count">
            <strong>{logs?.total ?? 0}</strong>
            {" "}logs
          </div>
        </div>

        <form
          className="observability-log-filters"
          onSubmit={handleLogSubmit}
        >
          <label>
            <span>Servicio</span>

            <select
              name="service"
              value={logFilters.service}
              onChange={handleLogFilterChange}
            >
              <option value="">
                Todos
              </option>

              <option value="backend">
                Backend
              </option>

              <option value="frontend">
                Frontend
              </option>

              <option value="service-checker">
                Service checker
              </option>

              <option value="postgres">
                PostgreSQL
              </option>

              <option value="postgres-backup">
                PostgreSQL backup
              </option>

              <option value="r2-upload">
                R2 upload
              </option>
            </select>
          </label>

          <label>
            <span>Nivel</span>

            <select
              name="level"
              value={logFilters.level}
              onChange={handleLogFilterChange}
            >
              <option value="">
                Todos
              </option>

              <option value="debug">
                Debug
              </option>

              <option value="info">
                Info
              </option>

              <option value="warning">
                Warning
              </option>

              <option value="error">
                Error
              </option>

              <option value="critical">
                Critical
              </option>
            </select>
          </label>

          <label>
            <span>Periodo</span>

            <select
              name="hours"
              value={logFilters.hours}
              onChange={handleLogFilterChange}
            >
              <option value="1">
                Última hora
              </option>

              <option value="6">
                Últimas 6 horas
              </option>

              <option value="24">
                Últimas 24 horas
              </option>

              <option value="72">
                Últimos 3 días
              </option>

              <option value="168">
                Últimos 7 días
              </option>
            </select>
          </label>

          <label className="observability-log-search">
            <span>Buscar</span>

            <input
              type="search"
              name="search"
              value={logFilters.search}
              onChange={handleLogFilterChange}
              placeholder="timeout, /health, database..."
            />
          </label>

          <button
            type="submit"
            className="refresh-button"
            disabled={logsLoading}
          >
            {logsLoading
              ? "Buscando..."
              : "Aplicar"}
          </button>
        </form>

        {logsError && (
          <div className="alert alert--error">
            <strong>
              Loki no disponible
            </strong>

            <span>{logsError}</span>
          </div>
        )}

        {logsLoading ? (
          <div className="security-empty">
            Consultando Loki...
          </div>
        ) : !logs?.logs?.length ? (
          <div className="security-empty">
            No se encontraron logs para estos
            filtros.
          </div>
        ) : (
          <div className="observability-log-list">
            {logs.logs.map((log, index) => (
              <article
                key={`${log.timestamp}-${index}`}
                className="observability-log-entry"
              >
                <div className="observability-log-meta">
                  <time>
                    {formatLogTime(log.timestamp)}
                  </time>

                  <span
                    className={
                      "observability-log-level " +
                      `observability-log-level--${
                        log.level || "unknown"
                      }`
                    }
                  >
                    {log.level || "unknown"}
                  </span>

                  <strong>
                    {log.service}
                  </strong>

                  {log.pod && (
                    <span
                      className="observability-log-pod"
                      title={log.pod}
                    >
                      {log.pod}
                    </span>
                  )}
                </div>

                <pre className="observability-log-message">
                  {log.message}
                </pre>

                {(log.trace_id || log.span_id) && (
                  <div className="observability-log-trace">
                    {log.trace_id && (
                      <span>
                        trace
                        <code>
                          {log.trace_id}
                        </code>

                        <button
                          type="button"
                          className="observability-log-trace-button"
                          onClick={() =>
                            handleOpenTrace(
                              log.trace_id,
                            )
                          }
                        >
                          Ver traza
                        </button>
                      </span>
                    )}

                    {log.span_id && (
                      <span>
                        span
                        <code>
                          {log.span_id}
                        </code>
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      </section>

    </section>
  );
}
