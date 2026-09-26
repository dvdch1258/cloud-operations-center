import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import IncidentCorrelation from "../components/IncidentCorrelation";
import "./IncidentDetailPage.css";

const statusKeys = new Set([
  "open",
  "investigating",
  "resolved",
  "closed",
]);

const severityKeys = new Set([
  "low",
  "medium",
  "high",
  "critical",
]);

const sourceKeys = new Set([
  "user",
  "checker",
  "automation",
  "legacy",
]);

const executionStatusKeys = new Set([
  "running",
  "success",
  "failed",
  "skipped",
]);

const fieldKeys = new Set([
  "title",
  "description",
  "severity",
  "status",
  "service_id",
]);

const tabKeys = [
  "timeline",
  "correlation",
  "automations",
  "logs",
  "traces",
];

function statusLabel(value, t) {
  return statusKeys.has(value)
    ? t(`incidentDetail.status.${value}`)
    : value;
}

function severityLabel(value, t) {
  return severityKeys.has(value)
    ? t(`incidentDetail.severity.${value}`)
    : value;
}

function sourceLabel(value, t) {
  return sourceKeys.has(value)
    ? t(`incidentDetail.source.${value}`)
    : value;
}

function executionStatusLabel(value, t) {
  return executionStatusKeys.has(value)
    ? t(`incidentDetail.executionStatus.${value}`)
    : value;
}

function fieldLabel(value, t) {
  return fieldKeys.has(value)
    ? t(`incidentDetail.fields.${value}`)
    : value;
}

function tabLabel(value, t) {
  return tabKeys.includes(value)
    ? t(`incidentDetail.tabs.${value}`)
    : value;
}

function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}

function date(value, language) {
  if (!value) return "—";

  // PostgreSQL sends an offset; SQLite historical fixtures may omit one.
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

function changeValue(field, value, t) {
  if (value == null) {
    return t("incidentDetail.common.unassigned");
  }

  if (field === "status") {
    return statusLabel(value, t);
  }

  if (field === "severity") {
    return severityLabel(value, t);
  }

  return String(value);
}

function TraceDetail({ traceId }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    setState({ loading: true });

    api.getObservabilityTrace(traceId).then(
      (data) => {
        if (active) setState({ data });
      },
      (error) => {
        if (active) {
          setState({
            error:
              error.status === 404
                ? t("incidentDetail.traceDetail.unavailable")
                : error.message,
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [traceId, revision, t]);
  return <section className="incident-trace-detail" aria-live="polite">
    <h3>{t("incidentDetail.traceDetail.title")}</h3><code>{traceId}</code>
    {/* V2_INCIDENT_TELEMETRY_STATES */}

    {state.loading && (
      <div
        className="incident-telemetry-state"
        role="status"
        aria-live="polite"
      >
        {t("incidentDetail.traceDetail.loading")}
      </div>
    )}

    {state.error && (
      <div
        className="alert alert--error incident-telemetry-error"
        role="alert"
      >
        <strong>
          {t("incidentDetail.traceDetail.loadError")}
        </strong>

        <span>{state.error}</span>

        <div className="v2-error-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setRevision(
                (value) => value + 1,
              )
            }
          >
            {t("incidentDetail.common.retry")}
          </button>
        </div>
      </div>
    )}
    {state.data && <>
      <p>{state.data.operation} · {state.data.service} · {Number(state.data.duration_ms).toFixed(2)} ms</p>
      <div className="incident-span-list">{state.data.spans.map((span) => <article key={span.span_id}>
        <strong>{span.name}</strong><span>{span.service} · {span.status} · {Number(span.duration_ms).toFixed(2)} ms</span>
      </article>)}</div>
    </>}
  </section>;
}

function Telemetry({ incidentId, kind, initialTraceId, onTrace, refreshToken }) {
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;

  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true });
  const [selectedTrace, setSelectedTrace] = useState(initialTraceId || "");
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    const getData = kind === "logs" ? api.getIncidentLogs : api.getIncidentTraces;
    getData(incidentId, filter).then(
      (data) => { if (active) setState({ data }); },
      (error) => { if (active) setState({ error: error.message }); },
    );
    return () => { active = false; };
  }, [incidentId, kind, filter, revision, refreshToken]);
  const items = state.data?.[kind] || [];
  return <div>
    <form className="incident-telemetry-form" onSubmit={(event) => {
      event.preventDefault(); setFilter(input.trim()); setRevision((value) => value + 1);
    }}>
      <label htmlFor={`incident-${kind}-service`}>
        {kind === "logs"
          ? t("incidentDetail.telemetry.serviceContextLogs")
          : t("incidentDetail.telemetry.serviceContextTraces")}
        <input id={`incident-${kind}-service`} value={input} maxLength={100}
          pattern={kind === "traces" ? "[A-Za-z0-9._-]+" : undefined}
          placeholder={
            kind === "logs"
              ? t("incidentDetail.telemetry.placeholderLogs")
              : t("incidentDetail.telemetry.placeholderTraces")
          }
          onChange={(event) => setInput(event.target.value)} />
      </label>
      <button
        className="secondary-button"
        disabled={state.loading}
      >
        {t("incidentDetail.telemetry.query")}
      </button>
      {filter && (
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setInput("");
            setFilter("");
          }}
        >
          {t("incidentDetail.telemetry.incidentOnly")}
        </button>
      )}
    </form>
    <p className="incident-hint">
      {filter
        ? t(
            "incidentDetail.telemetry.filteredHint",
            { filter },
          )
        : kind === "logs"
          ? t("incidentDetail.telemetry.logsHint")
          : t("incidentDetail.telemetry.tracesHint")}
    </p>
    {state.loading && (
      <div
        className="incident-telemetry-state"
        role="status"
        aria-live="polite"
      >
        {kind === "logs"
          ? t("incidentDetail.telemetry.loadingLogs")
          : t("incidentDetail.telemetry.loadingTraces")}
      </div>
    )}
    {state.error && (
      <div
        className="alert alert--error incident-telemetry-error"
        role="alert"
      >
        <strong>
          {kind === "logs"
            ? t("incidentDetail.telemetry.errorLogs")
            : t("incidentDetail.telemetry.errorTraces")}
        </strong>

        <span>{state.error}</span>

        <div className="v2-error-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={state.loading}
            onClick={() =>
              setRevision(
                (value) => value + 1,
              )
            }
          >
            {t("incidentDetail.common.retry")}
          </button>
        </div>
      </div>
    )}
    {state.data && <>
      {(kind === "logs" || filter) && (
        <p className="incident-hint">
          {t(
            "incidentDetail.telemetry.contextWindow",
            {
              start: date(
                state.data.window.start_at,
                language,
              ),
              end: date(
                state.data.window.end_at,
                language,
              ),
            },
          )}
          {state.data.window.truncated
            ? t(
                "incidentDetail.telemetry.windowTruncated",
              )
            : t(
                "incidentDetail.telemetry.windowExtended",
              )}
        </p>
      )}
      <p className="incident-hint">
        {t(
          "incidentDetail.telemetry.resultSummary",
          {
            count: items.length,
            max: kind === "logs" ? 100 : 50,
          },
        )}
      </p>
      {!items.length && (
        <div className="incident-empty">
          {kind === "logs"
            ? t("incidentDetail.telemetry.emptyLogs")
            : t("incidentDetail.telemetry.emptyTraces")}
        </div>
      )}
      <div className="incident-telemetry-list">{items.map((item, index) => kind === "logs"
        ? <article key={`${item.timestamp}-${index}`}>
          <div className="incident-event-meta"><time>{date(item.timestamp, language)}</time><span>{item.service} · {item.level}</span></div>
          <pre>{item.message}</pre>
          {item.trace_id && /^[a-f0-9]{32}$/i.test(item.trace_id) && !/^0+$/.test(item.trace_id) && <button type="button" className="secondary-button" onClick={() => onTrace(item.trace_id)}>{t("incidentDetail.common.openTrace")}</button>}
        </article>
        : <button type="button" className="incident-trace-row" key={item.trace_id}
          aria-pressed={selectedTrace === item.trace_id} onClick={() => setSelectedTrace(item.trace_id)}>
          <strong>{item.operation}</strong><code>{item.trace_id}</code>
          <span>{date(item.started_at, language)}{item.service ? ` · ${item.service}` : ""}{item.duration_ms != null ? ` · ${item.duration_ms} ms` : ""}</span>
        </button>)}</div>
    </>}
    {kind === "traces" && selectedTrace && <TraceDetail traceId={selectedTrace} />}
  </div>;
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("timeline");
  const [note, setNote] = useState("");
  const [traceId, setTraceId] = useState("");
  const requestVersion = useRef(0);
  const pageVersion = useRef(0);
  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError("");
    try {
      const result = await api.getIncidentDetails(incidentId);
      if (version === requestVersion.current) setData(result);
    } catch (requestError) {
      if (version === requestVersion.current) setError(
          requestError.status === 404
            ? t("incidentDetail.page.notFound")
            : requestError.message,
        );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [incidentId, t]);
  useEffect(() => {
    setData(null); setTab("timeline"); setNote(""); setTraceId(""); setBusy(false);
    reload();
    return () => { requestVersion.current += 1; pageVersion.current += 1; };
  }, [reload]);

  async function changeStatus(status) {
    const version = pageVersion.current;
    setBusy(true); setError("");
    try {
      await api.changeIncidentStatus(incidentId, status);
      if (version === pageVersion.current) await reload();
    } catch (requestError) { if (version === pageVersion.current) setError(requestError.message); }
    finally { if (version === pageVersion.current) setBusy(false); }
  }
  async function addNote(event) {
    const version = pageVersion.current;
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api.addIncidentNote(incidentId, note);
      if (version === pageVersion.current) { setNote(""); await reload(); }
    } catch (requestError) { if (version === pageVersion.current) setError(requestError.message); }
    finally { if (version === pageVersion.current) setBusy(false); }
  }
  async function loadMore(kind) {
    const version = requestVersion.current;
    const page = pageVersion.current;
    setBusy(true); setError("");
    try {
      if (kind === "timeline") {
        const page = await api.getIncidentTimeline(incidentId, data.timeline.events.length);
        if (version !== requestVersion.current) return;
        setData((current) => ({ ...current, timeline: { ...page, events: [...current.timeline.events, ...page.events.filter((event) => !current.timeline.events.some((known) => known.id === event.id))] } }));
      } else {
        const page = await api.getIncidentAutomations(incidentId, data.automations.length);
        if (version !== requestVersion.current) return;
        setData((current) => ({ ...current, automations: [...current.automations, ...page.filter((event) => !current.automations.some((known) => known.id === event.id))] }));
      }
    } catch (requestError) { if (version === requestVersion.current) setError(requestError.message); }
    finally { if (page === pageVersion.current) setBusy(false); }
  }
  function openTrace(id) { setTraceId(id); setTab("traces"); }
  const incident = data?.incident;

  return <div className="incident-detail">
    <Link
      to="/incidentes"
      className="incident-back-link"
    >
      {t("incidentDetail.page.back")}
    </Link>

    {/* V2_INCIDENT_DETAIL_INITIAL_STATE */}

    {error && (
      <div
        className="alert alert--error"
        role="alert"
      >
        <strong>
          {!data
            ? t("incidentDetail.page.loadError")
            : t("incidentDetail.page.operationError")}
        </strong>

        <span>{error}</span>

        {!data && (
          <div className="v2-error-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={reload}
            >
              {t("incidentDetail.common.retry")}
            </button>
          </div>
        )}
      </div>
    )}

    {loading && !data && (
      <section
        className="panel incident-detail-state"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <strong>
          {t("incidentDetail.page.loadingTitle")}
        </strong>

        <span>
          {t("incidentDetail.page.loadingDescription")}
        </span>
      </section>
    )}

    {incident && <>
      <header className="topbar incident-detail-header">
        <div><p className="eyebrow">{t("incidentDetail.page.eyebrow", { id: incident.id })}</p><h1>{incident.title}</h1>
          <div className="incident-detail-badges"><span className={`status-badge status-badge--${incident.status}`}>{statusLabel(incident.status, t)}</span>
            <span className={`severity-badge severity-badge--${incident.severity}`}>{severityLabel(incident.severity, t)}</span></div>
        </div>
        <button className="refresh-button" onClick={reload} disabled={loading || busy}>{loading ? t("incidentDetail.page.refreshing") : t("incidentDetail.page.refresh")}</button>
      </header>
      <section className="panel incident-context">
        <div><p className="eyebrow">{t("incidentDetail.page.affectedService")}</p>{data.service
          ? <><Link className="incident-service-link" to={`/servicios/${data.service.id}`}>{data.service.name} ↗</Link><p>{data.service.type} · {t("incidentDetail.page.currentStatus", { status: data.service.status })}</p></>
          : <><strong>{t("incidentDetail.page.missingService")}</strong><p>{t("incidentDetail.page.historyPreserved")}</p></>}
        </div>
        <div><span>{t("incidentDetail.page.created")}</span><strong>{date(incident.created_at, language)}</strong></div>
        <div><span>{t("incidentDetail.page.resolution")}</span><strong>{incident.resolved_at
  ? date(incident.resolved_at, language)
  : t("incidentDetail.common.ongoing")}</strong></div>
      </section>
      <section className="panel incident-description"><h2>{t("incidentDetail.page.description")}</h2><p>{incident.description}</p>
        <div className="table-actions">
          {incident.status === "open" && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("investigating")}>{t("incidentDetail.page.investigate")}</button>}
          {["open", "investigating"].includes(incident.status) && <button className="primary-button" disabled={busy || loading} onClick={() => changeStatus("resolved")}>{t("incidentDetail.page.resolve")}</button>}
          {incident.status === "resolved" && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("closed")}>{t("incidentDetail.page.close")}</button>}
          {["resolved", "closed"].includes(incident.status) && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("open")}>{t("incidentDetail.page.reopen")}</button>}
        </div>
      </section>
      <section className="panel incident-investigation">
        <nav className="incident-tabs" aria-label={t("incidentDetail.page.navigationAria")}>{tabKeys.map((key) => <button key={key} type="button"
          aria-pressed={tab === key} onClick={() => { setTab(key); setTraceId(""); }}>
          {tabLabel(key, t)}{key === "timeline" ? ` · ${data.timeline.total}` : key === "automations" ? ` · ${data.automations_total}` : ""}
        </button>)}</nav>
        <div className="incident-tab-content">
          {tab === "timeline" && <>
            <div className="incident-section-heading"><h2>{t("incidentDetail.timeline.title")}</h2><span>{t("incidentDetail.timeline.newestFirst")}</span></div>
            <form className="incident-note-form" onSubmit={addNote}><label htmlFor="incident-note">{t("incidentDetail.timeline.noteLabel")}</label>
              <textarea id="incident-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={3} placeholder={t("incidentDetail.timeline.notePlaceholder")} required />
              <button className="secondary-button" disabled={busy || loading || !note.trim()}>{busy
  ? t("incidentDetail.timeline.saving")
  : t("incidentDetail.timeline.addNote")}</button>
            </form>
            {!data.timeline.events.length && <p className="incident-empty">{t("incidentDetail.timeline.empty")}</p>}
            <ol className="incident-timeline">{data.timeline.events.map((event) => <li key={event.id}>
              <div className="incident-event-meta"><time>{date(event.occurred_at, language)}</time><span>{event.actor_username || sourceLabel(event.source, t)}</span></div>
              <h3>{event.summary}</h3>
              {event.source === "legacy" && <p className="incident-hint">{t("incidentDetail.timeline.legacyHint")}</p>}
              {event.changes?.text && <p className="incident-note-text">{event.changes.text}</p>}
              {Object.entries(event.changes || {}).filter(([, value]) => value && typeof value === "object" && "before" in value).map(([field, value]) => <details className="incident-change" key={field}>
                <summary>{fieldLabel(field, t)}</summary><div><del>{changeValue(field, value.before, t)}</del><span>→</span><strong>{changeValue(field, value.after, t)}</strong></div>
              </details>)}
              <div className="incident-event-actions">{event.automation_execution_id && <button className="secondary-button" onClick={() => setTab("automations")}>{t("incidentDetail.timeline.execution", { id: event.automation_execution_id })}</button>}
                {event.trace_id && <button className="secondary-button" onClick={() => openTrace(event.trace_id)}>{t("incidentDetail.timeline.viewTrace")}</button>}</div>
            </li>)}</ol>
            {data.timeline.events.length < data.timeline.total && <button className="secondary-button" disabled={busy || loading} onClick={() => loadMore("timeline")}>{t("incidentDetail.timeline.loadOlder")}</button>}
          </>}
          {tab === "correlation" && (
            <IncidentCorrelation
              incidentId={incidentId}
              onTrace={openTrace}
              refreshToken={data}
            />
          )}
          {tab === "automations" && <>
            <h2>{t("incidentDetail.automations.title")}</h2><p className="incident-hint">{t("incidentDetail.automations.hint")}</p>
            {!data.automations.length && <div className="incident-empty">{t("incidentDetail.automations.empty")}</div>}
            <div className="incident-automation-list">{data.automations.map((execution) => <article key={execution.id}>
              <div className="incident-section-heading"><h3>#{execution.id} · {execution.rule_name}</h3><span className={`incident-execution-state incident-execution-state--${execution.status}`}>{executionStatusLabel(execution.status, t)}</span></div>
              <p>{date(execution.started_at, language)} · {execution.duration_ms != null ? `${execution.duration_ms.toFixed(2)} ms` : t("incidentDetail.common.ongoing")}</p>
              {execution.error && (
                <details className="incident-change">
                  <summary>
                    {t("incidentDetail.automations.executionError")}
                  </summary>

                  <pre>
                    {execution.error}
                  </pre>
                </details>
              )}
              <details><summary>{t("incidentDetail.automations.triggerAndResult")}</summary><pre>{JSON.stringify({ trigger: execution.trigger_type, payload: execution.trigger_payload, result: execution.result }, null, 2)}</pre></details>
            </article>)}</div>
            {data.automations.length < data.automations_total && <button className="secondary-button" disabled={busy || loading} onClick={() => loadMore("automations")}>{t("incidentDetail.automations.loadMore")}</button>}
          </>}
          {["logs", "traces"].includes(tab) && <>
            <h2>
              {tab === "logs"
                ? t("incidentDetail.telemetry.logsTitle")
                : t("incidentDetail.telemetry.tracesTitle")}
            </h2>
            <Telemetry key={`${incidentId}-${tab}-${traceId}`} incidentId={incidentId} kind={tab} initialTraceId={traceId} onTrace={openTrace} refreshToken={data} />
          </>}
        </div>
      </section>
    </>}
  </div>;
}
