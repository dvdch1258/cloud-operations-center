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


function formatUpdatedAt(value) {
  if (!value) {
    return "Pendiente";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pendiente";
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


function SourceStatusChip({
  name,
  status,
}) {
  const labels = {
    connected: "Conectado",
    checking: "Comprobando",
    unavailable: "No disponible",
  };

  return (
    <div
      className={
        "observability-source-chip " +
        `observability-source-chip--${status}`
      }
    >
      <span
        className="observability-source-chip__dot"
        aria-hidden="true"
      />

      <strong>{name}</strong>

      <span>
        {labels[status] || status}
      </span>
    </div>
  );
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



function formatChartValue(
  value,
  suffix,
) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (suffix === "ms") {
    return `${value.toFixed(1)} ms`;
  }

  if (suffix === "%") {
    return `${value.toFixed(2)}%`;
  }

  return `${value.toFixed(2)} ${suffix}`;
}


function MultiTimeseriesChart({
  series,
  rangeHours,
}) {
  const width = 720;
  const height = 210;
  const padding = 18;

  const visibleSeries = series
    .map((item) => ({
      ...item,
      points: Array.isArray(item.points)
        ? item.points.filter(
            (point) =>
              Number.isFinite(
                Number(point?.value)
              )
          )
        : [],
    }))
    .filter(
      (item) => item.points.length > 0
    );

  if (!visibleSeries.length) {
    return (
      <div className="observability-chart-empty">
        Sin datos para este periodo.
      </div>
    );
  }

  const scaleGroups = {};

  visibleSeries.forEach((item) => {
    const group =
      item.scaleGroup || "default";

    const values = item.points.map(
      (point) => Number(point.value)
    );

    if (!scaleGroups[group]) {
      scaleGroups[group] = [];
    }

    scaleGroups[group].push(...values);
  });

  const groupMax = {};

  Object.entries(scaleGroups).forEach(
    ([group, values]) => {
      const maximum = Math.max(
        ...values,
        0,
      );

      groupMax[group] =
        maximum > 0
          ? maximum * 1.08
          : 1;
    }
  );

  const buildCoordinates = (item) => {
    const group =
      item.scaleGroup || "default";

    const maximum = groupMax[group] || 1;

    return item.points.map(
      (point, index) => {
        const x =
          item.points.length === 1
            ? width / 2
            : padding +
              (
                index /
                (item.points.length - 1)
              ) *
                (
                  width -
                  padding * 2
                );

        const value = Math.max(
          0,
          Number(point.value),
        );

        const ratio =
          Math.min(
            1,
            value / maximum,
          );

        const y =
          height -
          padding -
          ratio *
            (
              height -
              padding * 2
            );

        return `${x},${y}`;
      }
    );
  };

  return (
    <div className="observability-chart">
      <div className="observability-chart__legend">
        {visibleSeries.map((item) => {
          const latest =
            item.points[
              item.points.length - 1
            ];

          return (
            <div
              key={item.key}
              className="observability-chart__legend-item"
            >
              <span
                className={
                  "observability-chart__legend-dot " +
                  item.className
                }
              />

              <span>{item.label}</span>

              <strong>
                {formatChartValue(
                  Number(latest?.value),
                  item.suffix,
                )}
              </strong>
            </div>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          `Serie temporal de ${
            rangeLabel(rangeHours)
          }`
        }
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map(
          (position) => (
            <line
              key={position}
              className="observability-chart__grid"
              x1={padding}
              x2={width - padding}
              y1={height * position}
              y2={height * position}
            />
          )
        )}

        {visibleSeries.map((item) => (
          <polyline
            key={item.key}
            className={
              "observability-chart__line " +
              item.className
            }
            points={
              buildCoordinates(item).join(
                " "
              )
            }
          />
        ))}
      </svg>

      <div className="observability-chart__footer">
        <span>
          Hace {rangeLabel(rangeHours)}
        </span>

        <span />

        <span>Ahora</span>
      </div>
    </div>
  );
}


const OBSERVABILITY_RANGES = [
  {
    hours: 1,
    label: "1 h",
  },
  {
    hours: 6,
    label: "6 h",
  },
  {
    hours: 24,
    label: "24 h",
  },
  {
    hours: 168,
    label: "7 d",
  },
];


function rangeLabel(hours) {
  if (hours === 168) {
    return "7 días";
  }

  if (hours === 1) {
    return "1 hora";
  }

  return `${hours} horas`;
}


function getLogServiceName(service) {
  const value = [
    service?.name,
    service?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (value.includes("backend")) {
    return "backend";
  }

  if (value.includes("frontend")) {
    return "frontend";
  }

  if (
    value.includes("checker") ||
    value.includes("service checker")
  ) {
    return "service-checker";
  }

  if (
    value.includes("postgres") &&
    value.includes("backup")
  ) {
    return "postgres-backup";
  }

  if (value.includes("postgres")) {
    return "postgres";
  }

  if (
    value.includes("r2") &&
    value.includes("upload")
  ) {
    return "r2-upload";
  }

  return "";
}


function getTraceServiceName(service) {
  const value = [
    service?.name,
    service?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (value.includes("backend")) {
    return "cloud-operations-backend";
  }

  return "";
}



export default function ObservabilityPage() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [services, setServices] = useState(null);

  const [
    selectedHours,
    setSelectedHours,
  ] = useState(6);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] = useState(null);

  const [
    selectedService,
    setSelectedService,
  ] = useState(null);

  const [
    selectedServiceUptime,
    setSelectedServiceUptime,
  ] = useState(null);

  const [
    selectedServiceChecks,
    setSelectedServiceChecks,
  ] = useState([]);

  const [
    serviceDetailLoading,
    setServiceDetailLoading,
  ] = useState(false);

  const [
    serviceDetailError,
    setServiceDetailError,
  ] = useState("");

  const [
    serviceCheckRunning,
    setServiceCheckRunning,
  ] = useState(false);

  const [
    serviceCheckMessage,
    setServiceCheckMessage,
  ] = useState("");


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

  const [
    traceServiceFilter,
    setTraceServiceFilter,
  ] = useState("");
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
        api.getObservabilityTimeseries({
          hours: selectedHours,
        }),
        api.getObservabilityServices({
          hours: selectedHours,
        }),
      ]);

      setSummary(summaryResponse);
      setTimeseries(timeseriesResponse);
      setServices(servicesResponse);
      setLastUpdatedAt(new Date());
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo cargar la observabilidad.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedHours]);


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
    async (filters = {}) => {
      setTracesLoading(true);
      setTracesError("");

      try {
        const response =
          await api.getObservabilityTraces({
            hours:
              Number(filters.hours) || 1,
            limit: 12,
            service:
              filters.service || undefined,
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


  useEffect(() => {
    if (!selectedService) {
      setSelectedServiceUptime(null);
      setSelectedServiceChecks([]);
      setServiceDetailError("");
      return undefined;
    }

    let cancelled = false;

    const loadServiceDetail = async () => {
      setServiceDetailLoading(true);
      setServiceDetailError("");

      try {
        const [
          uptimeResponse,
          checksResponse,
        ] = await Promise.all([
          api.getServiceUptime(
            selectedService.id,
            selectedHours,
          ),
          api.getServiceChecks(
            selectedService.id,
            12,
          ),
        ]);

        if (cancelled) {
          return;
        }

        setSelectedServiceUptime(
          uptimeResponse
        );

        setSelectedServiceChecks(
          Array.isArray(checksResponse)
            ? checksResponse
            : []
        );
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setServiceDetailError(
          requestError.message ||
            "No se pudo cargar el detalle del servicio.",
        );
      } finally {
        if (!cancelled) {
          setServiceDetailLoading(false);
        }
      }
    };

    loadServiceDetail();

    return () => {
      cancelled = true;
    };
  }, [
    selectedService,
    selectedHours,
  ]);


  useEffect(() => {
    if (!selectedService) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedService(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedService]);


  const handleServiceLogs = async () => {
    if (!selectedService) {
      return;
    }

    const telemetryService =
      getLogServiceName(
        selectedService
      );

    if (!telemetryService) {
      setServiceCheckMessage(
        "Este servicio no tiene un nombre de logs asociado."
      );
      return;
    }

    const nextFilters = {
      service: telemetryService,
      level: "",
      hours: String(
        selectedHours === 168
          ? 72
          : selectedHours
      ),
      search: "",
    };

    setLogFilters(nextFilters);
    setSelectedService(null);

    await loadLogs(nextFilters);

    requestAnimationFrame(() => {
      document
        .getElementById(
          "observability-logs"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };


  const handleServiceTraces = async () => {
    if (!selectedService) {
      return;
    }

    const telemetryService =
      getTraceServiceName(
        selectedService
      );

    if (!telemetryService) {
      setServiceCheckMessage(
        "Este servicio no tiene un nombre de telemetría asociado."
      );
      return;
    }

    setTraceServiceFilter(
      telemetryService
    );

    setSelectedTrace(null);
    setSelectedService(null);

    await loadTraces({
      hours: selectedHours,
      service: telemetryService,
    });

    requestAnimationFrame(() => {
      document
        .getElementById(
          "observability-traces"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };


  const handleServiceCheckNow = async () => {
    if (
      !selectedService ||
      serviceCheckRunning
    ) {
      return;
    }

    const selectedId =
      selectedService.id;

    setServiceCheckRunning(true);
    setServiceCheckMessage("");

    try {
      await api.runServiceHealthCheck();

      const [
        summaryResponse,
        servicesResponse,
        uptimeResponse,
        checksResponse,
      ] = await Promise.all([
        api.getObservabilitySummary(),

        api.getObservabilityServices({
          hours: selectedHours,
        }),

        api.getServiceUptime(
          selectedId,
          selectedHours,
        ),

        api.getServiceChecks(
          selectedId,
          12,
        ),
      ]);

      setSummary(summaryResponse);
      setServices(servicesResponse);
      setSelectedServiceUptime(
        uptimeResponse
      );
      setSelectedServiceChecks(
        Array.isArray(checksResponse)
          ? checksResponse
          : []
      );

      const refreshedService =
        servicesResponse?.services?.find(
          (service) =>
            service.id === selectedId
        );

      if (refreshedService) {
        setSelectedService(
          refreshedService
        );
      }

      setLastUpdatedAt(new Date());

      setServiceCheckMessage(
        "Comprobación completada."
      );
    } catch (requestError) {
      setServiceCheckMessage(
        requestError.message ||
          "No se pudo ejecutar la comprobación."
      );
    } finally {
      setServiceCheckRunning(false);
    }
  };


  const handleRefresh = async () => {
    await Promise.all([
      loadSummary(),

      loadLogs(logFilters),

      loadTraces({
        hours: selectedHours,
        service:
          traceServiceFilter ||
          undefined,
      }),
    ]);
  };


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

  const refreshLoading =
    loading ||
    logsLoading ||
    tracesLoading;

  const prometheusSourceStatus =
    loading
      ? "checking"
      : summary?.prometheus_status === "up"
        ? "connected"
        : "unavailable";

  const lokiSourceStatus =
    logsLoading
      ? "checking"
      : logsError
        ? "unavailable"
        : logs
          ? "connected"
          : "checking";

  const tempoSourceStatus =
    tracesLoading
      ? "checking"
      : tracesError
        ? "unavailable"
        : traces
          ? "connected"
          : "checking";

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
          <div
            className="observability-range-selector"
            aria-label="Rango temporal"
          >
            {OBSERVABILITY_RANGES.map(
              (range) => (
                <button
                  key={range.hours}
                  type="button"
                  className={
                    "observability-range-button " +
                    (
                      selectedHours === range.hours
                        ? "observability-range-button--active"
                        : ""
                    )
                  }
                  disabled={loading}
                  onClick={() =>
                    setSelectedHours(
                      range.hours
                    )
                  }
                >
                  {range.label}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="refresh-button"
            disabled={refreshLoading}
            onClick={handleRefresh}
          >
            {refreshLoading
              ? "Actualizando..."
              : "Actualizar"}
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

        <div className="observability-health__meta">
          <div className="observability-last-update">
            <span>Última actualización</span>

            <strong>
              {formatUpdatedAt(
                lastUpdatedAt
              )}
            </strong>
          </div>

          <div className="observability-source-list">
            <SourceStatusChip
              name="Prometheus"
              status={
                prometheusSourceStatus
              }
            />

            <SourceStatusChip
              name="Loki"
              status={lokiSourceStatus}
            />

            <SourceStatusChip
              name="Tempo"
              status={tempoSourceStatus}
            />
          </div>
        </div>
      </section>

      <section className="metrics-grid observability-metrics">
        <article className="metric-card observability-kpi-card">
          <div className="observability-kpi-card__header">
            <span>Requests / s</span>

            <span className="observability-kpi-badge">
              tráfico
            </span>
          </div>

          <strong className="metric-card__value observability-kpi-card__value">
            {loading
              ? "—"
              : Number(
                  summary?.requests_per_second ?? 0
                ).toFixed(2)}
          </strong>

          <div className="observability-kpi-card__footer">
            <span>
              Actividad actual del backend
            </span>

            <small>
              rate · ventana 5 min
            </small>
          </div>
        </article>

        <article
          className={
            "metric-card observability-kpi-card " +
            (
              Number(
                summary?.error_rate_percent ?? 0
              ) >= 5
                ? "observability-kpi-card--critical"
                : "observability-kpi-card--healthy"
            )
          }
        >
          <div className="observability-kpi-card__header">
            <span>Error rate</span>

            <span className="observability-kpi-badge">
              HTTP 5xx
            </span>
          </div>

          <strong className="metric-card__value observability-kpi-card__value">
            {loading
              ? "—"
              : `${Number(
                  summary?.error_rate_percent ?? 0
                ).toFixed(2)}%`}
          </strong>

          <div className="observability-kpi-status">
            <span
              className="observability-kpi-status__dot"
              aria-hidden="true"
            />

            <strong>
              {Number(
                summary?.error_rate_percent ?? 0
              ) >= 5
                ? "Tasa elevada"
                : "Dentro del umbral"}
            </strong>
          </div>

          <div className="observability-kpi-card__footer">
            <small>
              Umbral degradado · 5%
            </small>
          </div>
        </article>

        <article className="metric-card observability-kpi-card observability-kpi-card--latency">
          <div className="observability-kpi-card__header">
            <span>Latencia</span>

            <span className="observability-kpi-badge">
              p95
            </span>
          </div>

          <div className="observability-kpi-primary">
            <strong className="metric-card__value observability-kpi-card__value">
              {loading
                ? "—"
                : `${Number(
                    summary?.latency_p95_ms ?? 0
                  ).toFixed(1)} ms`}
            </strong>

            <span>
              percentil 95
            </span>
          </div>

          <div className="observability-latency-quantiles">
            <div>
              <span>p50</span>
              <strong>
                {loading
                  ? "—"
                  : `${Number(
                      summary?.latency_p50_ms ?? 0
                    ).toFixed(1)} ms`}
              </strong>
            </div>

            <div>
              <span>p95</span>
              <strong>
                {loading
                  ? "—"
                  : `${Number(
                      summary?.latency_p95_ms ?? 0
                    ).toFixed(1)} ms`}
              </strong>
            </div>

            <div>
              <span>p99</span>
              <strong>
                {loading
                  ? "—"
                  : `${Number(
                      summary?.latency_p99_ms ?? 0
                    ).toFixed(1)} ms`}
              </strong>
            </div>
          </div>
        </article>

        <article className="metric-card observability-kpi-card observability-kpi-card--uptime">
          <div className="observability-kpi-card__header">
            <span>Backend uptime</span>

            <span className="observability-kpi-badge">
              runtime
            </span>
          </div>

          <strong className="metric-card__value observability-kpi-card__value">
            {loading
              ? "—"
              : formatUptime(
                  summary?.backend_uptime_seconds
                )}
          </strong>

          <div className="observability-kpi-status observability-kpi-status--active">
            <span
              className="observability-kpi-status__dot"
              aria-hidden="true"
            />

            <strong>Proceso activo</strong>
          </div>

          <div className="observability-kpi-card__footer">
            <span>
              Periodo visible ·{" "}
              {rangeLabel(selectedHours)}
            </span>

            <small>
              Actualizado{" "}
              {formatUpdatedAt(lastUpdatedAt)}
            </small>
          </div>
        </article>
      </section>

      <section className="observability-preview-grid">
        <article className="panel observability-preview">
          <div className="security-panel-header">
            <div>
              <p className="eyebrow">
                TRAFFIC & ERRORS
              </p>

              <h2>Tráfico y errores</h2>
            </div>

            <span>HTTP 5xx</span>
          </div>

          <MultiTimeseriesChart
            rangeHours={selectedHours}
            series={[
              {
                key: "requests",
                label: "Requests/s",
                points:
                  timeseries
                    ?.requests_per_second,
                suffix: "req/s",
                scaleGroup: "requests",
                className:
                  "observability-chart__series--requests",
              },
              {
                key: "errors",
                label: "Error rate",
                points:
                  timeseries
                    ?.error_rate_percent,
                suffix: "%",
                scaleGroup: "errors",
                className:
                  "observability-chart__series--errors",
              },
            ]}
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

            <span>p50 · p95 · p99</span>
          </div>

          <MultiTimeseriesChart
            rangeHours={selectedHours}
            series={[
              {
                key: "p50",
                label: "p50",
                points:
                  timeseries
                    ?.latency_p50_ms,
                suffix: "ms",
                scaleGroup: "latency",
                className:
                  "observability-chart__series--p50",
              },
              {
                key: "p95",
                label: "p95",
                points:
                  timeseries
                    ?.latency_p95_ms,
                suffix: "ms",
                scaleGroup: "latency",
                className:
                  "observability-chart__series--p95",
              },
              {
                key: "p99",
                label: "p99",
                points:
                  timeseries
                    ?.latency_p99_ms,
                suffix: "ms",
                scaleGroup: "latency",
                className:
                  "observability-chart__series--p99",
              },
            ]}
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
              durante las últimas{" "}
              {rangeLabel(selectedHours)}.
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
              <span>
                Uptime{" "}
                {rangeLabel(selectedHours)}
              </span>
              <span>Latencia</span>
              <span>HTTP</span>
              <span aria-hidden="true" />
            </div>

            {services.services.map((service) => {
              const isUp =
                service.status === "up";

              return (
                <div
                  key={service.id}
                  className="observability-service-row observability-service-row--interactive"
                  role="button"
                  tabIndex={0}
                  aria-label={
                    `Abrir detalles de ${service.name}`
                  }
                  onClick={() =>
                    setSelectedService(service)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();

                      setSelectedService(
                        service
                      );
                    }
                  }}
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
                      <strong>
                        {service.name}
                      </strong>

                      <span>
                        {service.type}
                      </span>
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
                    {isUp
                      ? "Healthy"
                      : "Down"}
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

                  <span
                    className="observability-service-row__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              );
            })}
          </div>
        )}

      {selectedService && (
        <div
          className="observability-service-drawer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedService(null);
            }
          }}
        >
          <aside
            className="observability-service-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-detail-title"
          >
            <div className="observability-service-drawer__header">
              <div>
                <p className="eyebrow">
                  SERVICE DETAILS
                </p>

                <h2 id="service-detail-title">
                  {selectedService.name}
                </h2>

                <span>
                  {selectedService.type}
                </span>
              </div>

              <button
                type="button"
                className="observability-service-drawer__close"
                aria-label="Cerrar detalle"
                onClick={() =>
                  setSelectedService(null)
                }
              >
                ×
              </button>
            </div>

            <div className="observability-service-drawer__status">
              <span
                className={
                  "observability-service-dot " +
                  (
                    selectedService.status === "up"
                      ? "observability-service-dot--up"
                      : "observability-service-dot--down"
                  )
                }
              />

              <strong>
                {selectedService.status === "up"
                  ? "Healthy"
                  : "Down"}
              </strong>

              <span>
                · últimas{" "}
                {rangeLabel(selectedHours)}
              </span>
            </div>

            {serviceDetailError && (
              <div className="alert alert--error">
                {serviceDetailError}
              </div>
            )}

            {serviceDetailLoading ? (
              <div className="security-empty">
                Cargando detalle...
              </div>
            ) : (
              <>
                <div className="observability-service-detail-grid">
                  <div>
                    <span>Uptime</span>

                    <strong>
                      {selectedServiceUptime
                        ?.uptime_percent == null
                        ? "—"
                        : `${Number(
                            selectedServiceUptime
                              .uptime_percent
                          ).toFixed(2)}%`}
                    </strong>
                  </div>

                  <div>
                    <span>Latencia media</span>

                    <strong>
                      {selectedServiceUptime
                        ?.average_response_time_ms == null
                        ? "—"
                        : `${Number(
                            selectedServiceUptime
                              .average_response_time_ms
                          ).toFixed(1)} ms`}
                    </strong>
                  </div>

                  <div>
                    <span>Última latencia</span>

                    <strong>
                      {selectedService
                        .last_response_time_ms == null
                        ? "—"
                        : `${Number(
                            selectedService
                              .last_response_time_ms
                          ).toFixed(1)} ms`}
                    </strong>
                  </div>

                  <div>
                    <span>Checks</span>

                    <strong>
                      {selectedServiceUptime
                        ?.checks_total ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span>HTTP</span>

                    <strong>
                      {selectedService
                        .last_status_code ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Checks DOWN</span>

                    <strong>
                      {selectedServiceUptime
                        ?.checks_down ?? 0}
                    </strong>
                  </div>
                </div>

                <div className="observability-service-detail-error">
                  <span>Último error</span>

                  <strong>
                    {selectedService.last_error ||
                      "Ninguno"}
                  </strong>
                </div>

                <section className="observability-service-checks">
                  <div className="observability-service-checks__header">
                    <div>
                      <p className="eyebrow">
                        RECENT CHECKS
                      </p>

                      <h3>
                        Comprobaciones recientes
                      </h3>
                    </div>

                    <span>
                      {selectedServiceChecks.length}
                    </span>
                  </div>

                  {!selectedServiceChecks.length ? (
                    <div className="security-empty">
                      No hay comprobaciones.
                    </div>
                  ) : (
                    <div className="observability-service-check-list">
                      {selectedServiceChecks.map(
                        (check) => {
                          const checkUp =
                            check.status === "up";

                          return (
                            <div
                              key={check.id}
                              className="observability-service-check-row"
                            >
                              <time>
                                {formatLogTime(
                                  check.checked_at
                                )}
                              </time>

                              <span
                                className={
                                  "observability-service-status " +
                                  (
                                    checkUp
                                      ? "observability-service-status--up"
                                      : "observability-service-status--down"
                                  )
                                }
                              >
                                {checkUp
                                  ? "UP"
                                  : "DOWN"}
                              </span>

                              <strong>
                                {check.response_time_ms == null
                                  ? "—"
                                  : `${Number(
                                      check.response_time_ms
                                    ).toFixed(1)} ms`}
                              </strong>

                              <span>
                                HTTP{" "}
                                {check.status_code ??
                                  "—"}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>

                <section className="observability-service-correlation">
                  <div className="observability-service-correlation__header">
                    <div>
                      <p className="eyebrow">
                        CORRELATION
                      </p>

                      <h3>
                        Telemetría del servicio
                      </h3>
                    </div>
                  </div>

                  <div className="observability-service-correlation__sources">
                    <div>
                      <span className="observability-service-correlation__source">
                        Loki
                      </span>

                      <strong>
                        {getLogServiceName(
                          selectedService
                        ) || "Sin mapeo"}
                      </strong>
                    </div>

                    <span
                      className="observability-service-correlation__arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>

                    <div>
                      <span className="observability-service-correlation__source">
                        Tempo
                      </span>

                      <strong>
                        {getTraceServiceName(
                          selectedService
                        ) || "Sin mapeo"}
                      </strong>
                    </div>
                  </div>
                </section>

                {serviceCheckMessage && (
                  <div className="observability-service-action-message">
                    {serviceCheckMessage}
                  </div>
                )}

                <div className="observability-service-actions">
                  <button
                    type="button"
                    disabled={
                      !getLogServiceName(
                        selectedService
                      )
                    }
                    onClick={handleServiceLogs}
                  >
                    Ver logs
                  </button>

                  <button
                    type="button"
                    disabled={
                      !getTraceServiceName(
                        selectedService
                      )
                    }
                    onClick={
                      handleServiceTraces
                    }
                  >
                    Ver trazas
                  </button>

                  <button
                    type="button"
                    className="observability-service-actions__primary"
                    disabled={serviceCheckRunning}
                    onClick={
                      handleServiceCheckNow
                    }
                  >
                    {serviceCheckRunning
                      ? "Comprobando..."
                      : "↻ Comprobar ahora"}
                  </button>
                </div>
              </>
            )}
          </aside>
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
            {traceServiceFilter && (
              <button
                type="button"
                className="observability-trace-filter"
                title="Quitar filtro de servicio"
                onClick={async () => {
                  setTraceServiceFilter("");
                  setSelectedTrace(null);

                  await loadTraces({
                    hours: selectedHours,
                  });
                }}
              >
                Servicio ·{" "}
                {traceServiceFilter}
                <span aria-hidden="true">
                  ×
                </span>
              </button>
            )}

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
              onClick={() =>
                loadTraces({
                  hours: selectedHours,
                  service:
                    traceServiceFilter ||
                    undefined,
                })
              }
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

      <section
        id="observability-logs"
        className="panel observability-logs-panel"
      >
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
