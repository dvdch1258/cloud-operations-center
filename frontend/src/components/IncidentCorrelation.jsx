import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";

function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}

function formatDate(value, language) {
  if (!value) return "—";

  const normalized =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`;

  return new Date(normalized).toLocaleString(
    language
      ? localeForLanguage(language)
      : undefined,
  );
}

const sourceStatusKeys = new Set([
  "available",
  "unavailable",
  "skipped",
]);

function sourceStatusLabel(value, t) {
  return sourceStatusKeys.has(value)
    ? t(
        `incidentDetail.correlation.sourceStatus.${value}`,
      )
    : value;
}

export default function IncidentCorrelation({
  incidentId,
  onTrace,
  refreshToken,
}) {
  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage || i18n.language;

  const [state, setState] = useState({
    loading: true,
  });

  useEffect(() => {
    let active = true;

    setState({
      loading: true,
    });

    api.getIncidentCorrelation(incidentId).then(
      (data) => {
        if (active) {
          setState({ data });
        }
      },
      (error) => {
        if (active) {
          setState({
            error: error.message,
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [incidentId, refreshToken]);

  if (state.loading) {
    return (
      <p role="status">
        {t("incidentDetail.correlation.loading")}
      </p>
    );
  }

  if (state.error) {
    return (
      <div
        className="alert alert--error"
        role="alert"
      >
        {state.error}
      </div>
    );
  }

  const correlation = state.data;
  const summary = correlation.summary;

  const logs = correlation.logs || [];
  const traces = correlation.traces || [];
  const capturedTraces =
    correlation.captured_traces || [];

  const rankedSignals =
    correlation.ranked_signals || [];

  return (
    <div className="incident-correlation">
      <div className="incident-section-heading">
        <div>
          <h2>{t("incidentDetail.correlation.title")}</h2>

          <p className="incident-hint">
            {t("incidentDetail.correlation.description")}
          </p>
        </div>

        <div
          className="incident-correlation-sources"
          aria-label={t("incidentDetail.correlation.sourcesAria")}
        >
          {["loki", "tempo"].map((source) => {
            const status =
              correlation.sources[source];

            return (
              <span
                key={source}
                className={
                  `incident-source-state ` +
                  `incident-source-state--${status}`
                }
              >
                {source === "loki"
                  ? "Loki"
                  : "Tempo"}
                {" · "}
                {sourceStatusLabel(status, t)}
              </span>
            );
          })}
        </div>
      </div>

      <p className="incident-hint">
        {t(
          "incidentDetail.correlation.window",
          {
            start: formatDate(
              correlation.window.start_at,
              language,
            ),
            end: formatDate(
              correlation.window.end_at,
              language,
            ),
          },
        )}
        {correlation.window.truncated
          ? t(
              "incidentDetail.correlation.windowTruncated",
            )
          : t(
              "incidentDetail.correlation.windowExtended",
            )}
      </p>

      <div className="incident-correlation-summary">
        <article>
          <span>{t("incidentDetail.correlation.summary.logs")}</span>
          <strong>{summary.logs_total}</strong>
        </article>

        <article>
          <span>{t("incidentDetail.correlation.summary.errors")}</span>
          <strong>{summary.errors_total}</strong>
        </article>

        <article>
          <span>{t("incidentDetail.correlation.summary.tempoTraces")}</span>
          <strong>{summary.traces_total}</strong>
        </article>

        <article>
          <span>{t("incidentDetail.correlation.summary.capturedTraces")}</span>
          <strong>
            {summary.captured_traces_total}
          </strong>
        </article>

          <article>
            <span>{t("incidentDetail.correlation.summary.prioritySignals")}</span>
            <strong>
              {summary.signals_total ??
                rankedSignals.length}
            </strong>
          </article>
      </div>

        <section className="incident-correlation-section">
          <div className="incident-section-heading">
            <div>
              <h3>{t("incidentDetail.correlation.priority.title")}</h3>
              <p className="incident-hint">
                {t("incidentDetail.correlation.priority.description")}
              </p>
            </div>

            <span>
              {t("incidentDetail.common.results", {
                count: rankedSignals.length,
              })}
            </span>
          </div>

          {!rankedSignals.length && (
            <div className="incident-empty">
              {t("incidentDetail.correlation.priority.empty")}
            </div>
          )}

          {rankedSignals.length > 0 && (
            <div className="incident-signal-list">
              {rankedSignals.map((signal, index) => {
                const traceIdValid =
                  signal.trace_id &&
                  /^[a-f0-9]{32}$/i.test(
                    signal.trace_id,
                  ) &&
                  !/^0+$/.test(signal.trace_id);

                const sourceLabel =
                  {
                    tempo: "Tempo",
                    loki: "Loki",
                    incident: t(
                      "incidentDetail.correlation.priority.sourceIncident",
                    ),
                  }[signal.source] ||
                  signal.source;

                const kindLabel =
                  signal.kind === "trace"
                    ? t(
                        "incidentDetail.correlation.priority.kindTrace",
                      )
                    : t(
                        "incidentDetail.correlation.priority.kindLog",
                      );

                const severityLabel =
                  {
                    high: t("incidentDetail.severity.high"),
                    medium: t("incidentDetail.severity.medium"),
                    low: t("incidentDetail.severity.low"),
                  }[signal.severity] ||
                  signal.severity;

                const technicalDetails = [
                  signal.status
                    ? t(
                        "incidentDetail.correlation.priority.technicalStatus",
                        { value: signal.status },
                      )
                    : null,
                  signal.level
                    ? t(
                        "incidentDetail.correlation.priority.technicalLevel",
                        { value: signal.level },
                      )
                    : null,
                  signal.http_status_codes?.length
                    ? `HTTP ${signal.http_status_codes.join(
                        ", ",
                      )}`
                    : null,
                  signal.duration_ms != null
                    ? `${signal.duration_ms} ms`
                    : null,
                  signal.spans_total != null
                    ? t(
                        "incidentDetail.correlation.priority.spans",
                        { count: signal.spans_total },
                      )
                    : null,
                ].filter(Boolean);

                return (
                  <article
                    className={
                      `incident-signal-card ` +
                      `incident-signal-card--${signal.severity}`
                    }
                    key={
                      `${signal.kind}-` +
                      `${signal.trace_id ||
                        signal.started_at ||
                        index}-` +
                      `${index}`
                    }
                  >
                    <div className="incident-signal-header">
                      <div className="incident-signal-badges">
                        <span
                          className={
                            `incident-signal-severity ` +
                            `incident-signal-severity--${signal.severity}`
                          }
                        >
                          {severityLabel}
                        </span>

                        <span className="incident-signal-source">
                          {kindLabel} · {sourceLabel}
                        </span>
                      </div>

                      <strong className="incident-signal-score">
                        {t(
                          "incidentDetail.correlation.priority.relevance",
                          { score: signal.score },
                        )}
                      </strong>
                    </div>

                    <div className="incident-signal-body">
                      <strong className="incident-signal-title">
                        {signal.title}
                      </strong>

                      {signal.started_at && (
                        <time>
                          {formatDate(
                            signal.started_at,
                            language,
                          )}
                        </time>
                      )}

                      {technicalDetails.length > 0 && (
                        <span className="incident-signal-technical">
                          {technicalDetails.join(
                            " · ",
                          )}
                        </span>
                      )}

                      {signal.trace_id && (
                        <code>
                          {signal.trace_id}
                        </code>
                      )}

                      {signal.message &&
                        signal.kind === "log" && (
                          <pre>
                            {signal.message}
                          </pre>
                        )}
                    </div>

                    {signal.reasons?.length > 0 && (
                      <ul className="incident-signal-reasons">
                        {signal.reasons.map(
                          (reason, reasonIndex) => (
                            <li
                              key={
                                `${reason}-` +
                                `${reasonIndex}`
                              }
                            >
                              {reason}
                            </li>
                          ),
                        )}
                      </ul>
                    )}

                    {traceIdValid && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          onTrace(signal.trace_id)
                        }
                      >
                        {t("incidentDetail.common.openTrace")}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

      <section className="incident-correlation-section">
        <div className="incident-section-heading">
          <h3>
            {t("incidentDetail.correlation.relatedLogs.title")}
          </h3>
          <span>
            {t("incidentDetail.common.results", {
              count: logs.length,
            })}
          </span>
        </div>

        {correlation.sources.loki ===
          "unavailable" && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.relatedLogs.unavailable",
            )}
          </div>
        )}

        {correlation.sources.loki ===
          "available" &&
          !logs.length && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.relatedLogs.empty",
            )}
          </div>
        )}

        {correlation.sources.loki ===
          "available" &&
          logs.length > 0 && (
          <div className="incident-telemetry-list">
            {logs.map((item, index) => (
              <article
                key={`${item.timestamp}-${index}`}
              >
                <div className="incident-event-meta">
                  <time>
                    {formatDate(
                      item.timestamp,
                      language,
                    )}
                  </time>

                  <span>
                    {[
                      item.service,
                      item.level,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                <pre>{item.message}</pre>

                {item.trace_id &&
                  /^[a-f0-9]{32}$/i.test(
                    item.trace_id,
                  ) &&
                  !/^0+$/.test(
                    item.trace_id,
                  ) && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onTrace(item.trace_id)
                      }
                    >
                      {t("incidentDetail.common.openTrace")}
                    </button>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="incident-correlation-section">
        <div className="incident-section-heading">
          <h3>
            {t("incidentDetail.correlation.relatedTraces.title")}
          </h3>
          <span>
            {t("incidentDetail.common.results", {
              count: traces.length,
            })}
          </span>
        </div>

        {correlation.sources.tempo ===
          "unavailable" && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.relatedTraces.unavailable",
            )}
          </div>
        )}

        {correlation.sources.tempo ===
          "skipped" && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.relatedTraces.skipped",
            )}
          </div>
        )}

        {correlation.sources.tempo ===
          "available" &&
          !traces.length && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.relatedTraces.empty",
            )}
          </div>
        )}

        {correlation.sources.tempo ===
          "available" &&
          traces.length > 0 && (
          <div className="incident-telemetry-list">
            {traces.map((item) => (
              <button
                type="button"
                className="incident-trace-row"
                key={item.trace_id}
                onClick={() =>
                  onTrace(item.trace_id)
                }
              >
                <strong>{item.operation}</strong>
                <code>{item.trace_id}</code>

                <span>
                  {formatDate(
                    item.started_at,
                    language,
                  )}
                  {item.service
                    ? ` · ${item.service}`
                    : ""}
                  {item.duration_ms != null
                    ? ` · ${item.duration_ms} ms`
                    : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="incident-correlation-section">
        <div className="incident-section-heading">
          <h3>
            {t(
              "incidentDetail.correlation.capturedTraces.title",
            )}
          </h3>

          <span>
            {t("incidentDetail.common.results", {
              count: capturedTraces.length,
            })}
          </span>
        </div>

        <p className="incident-hint">
          {t(
            "incidentDetail.correlation.capturedTraces.description",
          )}
        </p>

        {!capturedTraces.length && (
          <div className="incident-empty">
            {t(
              "incidentDetail.correlation.capturedTraces.empty",
            )}
          </div>
        )}

        {capturedTraces.length > 0 && (
          <div className="incident-telemetry-list">
            {capturedTraces.map((item) => (
              <button
                type="button"
                className="incident-trace-row"
                key={item.trace_id}
                onClick={() =>
                  onTrace(item.trace_id)
                }
              >
                <strong>{item.operation}</strong>
                <code>{item.trace_id}</code>

                <span>
                  {formatDate(
                    item.started_at,
                    language,
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
