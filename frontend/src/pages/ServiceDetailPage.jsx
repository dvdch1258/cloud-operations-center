/* SERVICE_DETAIL_I18N_FOUNDATION */
/* SERVICE_DETAIL_I18N_VISIBLE */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import i18n from "../i18n";

const statusLabels = {
  up: "serviceDetail.status.up",
  down: "serviceDetail.status.down",
  unknown: "serviceDetail.status.unknown",
};

function formatLatency(value) {
  if (value == null) {
    return "—";
  }

  return `${Number(value).toFixed(1)} ms`;
}

function formatUptime(value) {
  if (value == null) {
    return i18n.t("serviceDetail.noData");
  }

  return `${Number(value).toFixed(2)} %`;
}


function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const locale =
    String(i18n.language || "")
      .toLowerCase()
      .startsWith("es")
      ? "es-ES"
      : "en-GB";

  return date.toLocaleTimeString(
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
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
        {i18n.t(
          "serviceDetail.chartEmpty",
        )}
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
        aria-label={i18n.t(
          "serviceDetail.chartAria",
        )}
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
  const { t } = useTranslation();
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
      <section className="panel">{t("serviceDetail.loading")}</section>
    );
  }

  if (!service) {
    return (
      <>
        <Link
          className="back-link"
          to="/servicios"
        >{t("serviceDetail.backFull")}</Link>

        <section className="alert alert--error">
          <strong>{t("serviceDetail.loadError")}</strong>

          <span>{error}</span>

          <div className="v2-error-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={loadData}
            >
              {t("common.refresh")}
            </button>
          </div>
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
          >{t("serviceDetail.back")}</Link>

          <p className="eyebrow">{t("serviceDetail.eyebrow")}</p>

          <h1>{service.name}</h1>

          <p className="subtitle">
            {service.endpoint}
          </p>
        </div>

        <div className="service-detail__header-actions">
          <Link
            to="/operaciones"
            className="service-detail__operations-link"
          >
            {t("nav.operations")}
          </Link>

          <button
            type="button"
            className="refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            {loading
              ? t("serviceDetail.refreshing")
              : t("serviceDetail.refresh")}
          </button>
        </div>
      </header>

      {error && (
        <section className="alert alert--error">
          <strong>{t("serviceDetail.updateError")}</strong>
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
            {statusLabels[service.status]
              ? t(
                  statusLabels[
                    service.status
                  ],
                )
              : service.status}
          </span>

          <strong>
            {t(
              `services.types.${service.type}`,
              {
                defaultValue:
                  service.type,
              },
            )}
          </strong>
        </div>

        <span>
          {lastUpdatedAt
            ? t(
                "serviceDetail.updated",
                {
                  time: formatTime(
                    lastUpdatedAt,
                  ),
                },
              )
            : t(
                "serviceDetail.waiting",
              )}
        </span>
      </section>

      <section className="service-detail-metrics">
        <article className="metric-card metric-card--success">
          <div className="metric-card__header">
            <span>{t("serviceDetail.uptime1h")}</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatUptime(uptime1h?.uptime_percent)}
          </strong>

          <p>
            {t(
              "serviceDetail.checks",
              {
                count:
                  uptime1h
                    ?.checks_total ?? 0,
              },
            )}
          </p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>{t("serviceDetail.uptime24h")}</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatUptime(uptime24h?.uptime_percent)}
          </strong>

          <p>
            {t(
              "serviceDetail.availableChecks",
              {
                count:
                  uptime24h
                    ?.checks_total ?? 0,
              },
            )}
          </p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>{t("serviceDetail.averageLatency")}</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {formatLatency(
              uptime1h?.average_response_time_ms
            )}
          </strong>

          <p>{t("serviceDetail.averageLastHour")}</p>
        </article>

        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>{t("serviceDetail.lastCheck")}</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value metric-card__value--time">
            {uptime1h?.last_checked_at
              ? formatTime(
                  uptime1h.last_checked_at,
                )
              : "—"}
          </strong>

          <p>{t("serviceDetail.latestAutomaticCheck")}</p>
        </article>
      </section>

      <section className="panel detail-chart-panel">
        <div className="panel__header">
          <div>
            <h2>{t("serviceDetail.latencyEvolution")}</h2>

            <span>
              {t(
                "serviceDetail.lastChecks",
                {
                  count: checks.length,
                },
              )}
            </span>
          </div>

          <span>
            {checks[0]?.response_time_ms != null
              ? t(
                  "serviceDetail.current",
                  {
                    value: formatLatency(
                      checks[0]
                        .response_time_ms,
                    ),
                  },
                )
              : t("serviceDetail.noData")}
          </span>
        </div>

        <LatencyChart checks={checks} />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>{t("serviceDetail.recentHistory")}</h2>
            <span>{t("serviceDetail.latestChecks")}</span>
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("serviceDetail.table.time")}</th>
                <th>{t("serviceDetail.table.status")}</th>
                <th>HTTP</th>
                <th>{t("serviceDetail.table.latency")}</th>
                <th>{t("serviceDetail.table.detail")}</th>
              </tr>
            </thead>

            <tbody>
              {checks.slice(0, 15).map((check) => (
                <tr key={check.id}>
                  <td>
                    {formatTime(
                      check.checked_at,
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        `status-badge ` +
                        `status-badge--${check.status}`
                      }
                    >
                      {statusLabels[check.status]
                        ? t(
                            statusLabels[
                              check.status
                            ],
                          )
                        : check.status}
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
                    {check.error ||
                      t(
                        "serviceDetail.noErrors",
                      )}
                  </td>
                </tr>
              ))}

              {!checks.length && (
                <tr>
                  <td colSpan="5">{t("serviceDetail.noChecks")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
