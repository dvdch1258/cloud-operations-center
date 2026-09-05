import { useEffect, useState } from "react";
import { api } from "../api/client";

function formatDate(value) {
  if (!value) return "—";

  const normalized =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`;

  return new Date(normalized).toLocaleString();
}

const sourceLabels = {
  available: "Disponible",
  unavailable: "No disponible",
  skipped: "No consultado",
};

export default function IncidentCorrelation({
  incidentId,
  onTrace,
  refreshToken,
}) {
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
        Correlacionando incidente con Loki y Tempo…
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

  return (
    <div className="incident-correlation">
      <div className="incident-section-heading">
        <div>
          <h2>Correlación operativa</h2>

          <p className="incident-hint">
            Contexto observado automáticamente durante
            la ventana temporal del incidente.
          </p>
        </div>

        <div
          className="incident-correlation-sources"
          aria-label="Estado de las fuentes"
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
                {sourceLabels[status] || status}
              </span>
            );
          })}
        </div>
      </div>

      <p className="incident-hint">
        Ventana de correlación:{" "}
        {formatDate(correlation.window.start_at)}
        {" — "}
        {formatDate(correlation.window.end_at)}.
        {correlation.window.truncated
          ? " Limitada a los últimos 7 días."
          : " Incluye hasta 5 minutos antes de la creación y después de la resolución."}
      </p>

      <div className="incident-correlation-summary">
        <article>
          <span>Logs</span>
          <strong>{summary.logs_total}</strong>
        </article>

        <article>
          <span>Errores</span>
          <strong>{summary.errors_total}</strong>
        </article>

        <article>
          <span>Trazas Tempo</span>
          <strong>{summary.traces_total}</strong>
        </article>

        <article>
          <span>Trazas capturadas</span>
          <strong>
            {summary.captured_traces_total}
          </strong>
        </article>
      </div>

      <section className="incident-correlation-section">
        <div className="incident-section-heading">
          <h3>Logs relacionados · Loki</h3>
          <span>{logs.length} resultados</span>
        </div>

        {correlation.sources.loki ===
          "unavailable" && (
          <div className="incident-empty">
            Loki no está disponible actualmente.
            La correlación continúa con las demás
            fuentes.
          </div>
        )}

        {correlation.sources.loki ===
          "available" &&
          !logs.length && (
          <div className="incident-empty">
            No se encontraron logs relacionados
            durante esta ventana.
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
                    {formatDate(item.timestamp)}
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
                      Abrir traza
                    </button>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="incident-correlation-section">
        <div className="incident-section-heading">
          <h3>Trazas relacionadas · Tempo</h3>
          <span>{traces.length} resultados</span>
        </div>

        {correlation.sources.tempo ===
          "unavailable" && (
          <div className="incident-empty">
            Tempo no está disponible actualmente.
            Los logs y las trazas capturadas siguen
            disponibles.
          </div>
        )}

        {correlation.sources.tempo ===
          "skipped" && (
          <div className="incident-empty">
            Tempo no se ha consultado porque el
            incidente no tiene actualmente un
            servicio afectado.
          </div>
        )}

        {correlation.sources.tempo ===
          "available" &&
          !traces.length && (
          <div className="incident-empty">
            No se encontraron trazas del servicio
            durante esta ventana.
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
                  {formatDate(item.started_at)}
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
            Trazas capturadas por el incidente
          </h3>

          <span>
            {capturedTraces.length} resultados
          </span>
        </div>

        <p className="incident-hint">
          Trace IDs registrados directamente en
          eventos del incidente, independientemente
          de la búsqueda actual en Tempo.
        </p>

        {!capturedTraces.length && (
          <div className="incident-empty">
            Este incidente todavía no tiene trace IDs
            capturados en su línea temporal.
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
                  {formatDate(item.started_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
