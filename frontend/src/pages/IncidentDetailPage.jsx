import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import "./IncidentDetailPage.css";

const statuses = { open: "Abierto", investigating: "Investigando", resolved: "Resuelto", closed: "Cerrado" };
const severities = { low: "Baja", medium: "Media", high: "Alta", critical: "Crítica" };
const sources = { user: "Operador", checker: "Comprobador", automation: "Automatización", legacy: "Histórico" };
const executionStatuses = { running: "En ejecución", success: "Correcta", failed: "Fallida", skipped: "Omitida" };
const fields = { title: "Título", description: "Descripción", severity: "Severidad", status: "Estado", service_id: "Servicio" };
const tabs = [["timeline", "Línea temporal"], ["automations", "Automatizaciones"], ["logs", "Logs · Loki"], ["traces", "Trazas · Tempo"]];

function date(value) {
  if (!value) return "—";
  // PostgreSQL sends an offset; SQLite historical fixtures may omit one.
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).toLocaleString();
}

function changeValue(field, value) {
  if (value == null) return "Sin asignar";
  if (field === "status") return statuses[value] || value;
  if (field === "severity") return severities[value] || value;
  return String(value);
}

function TraceDetail({ traceId }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    api.getObservabilityTrace(traceId).then(
      (data) => { if (active) setState({ data }); },
      (error) => { if (active) setState({ error: error.status === 404 ? "Esta traza ya no está disponible en Tempo o aún no se ha indexado." : error.message }); },
    );
    return () => { active = false; };
  }, [traceId]);
  return <section className="incident-trace-detail" aria-live="polite">
    <h3>Detalle de traza</h3><code>{traceId}</code>
    {state.loading && <p>Cargando traza…</p>}
    {state.error && <p role="alert">{state.error}</p>}
    {state.data && <>
      <p>{state.data.operation} · {state.data.service} · {Number(state.data.duration_ms).toFixed(2)} ms</p>
      <div className="incident-span-list">{state.data.spans.map((span) => <article key={span.span_id}>
        <strong>{span.name}</strong><span>{span.service} · {span.status} · {Number(span.duration_ms).toFixed(2)} ms</span>
      </article>)}</div>
    </>}
  </section>;
}

function Telemetry({ incidentId, kind, initialTraceId, onTrace, refreshToken }) {
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
      <label htmlFor={`incident-${kind}-service`}>{kind === "logs" ? "Contexto del servicio · etiqueta Loki service_name" : "Contexto del servicio · nombre Tempo service.name"}
        <input id={`incident-${kind}-service`} value={input} maxLength={100}
          pattern={kind === "traces" ? "[A-Za-z0-9._-]+" : undefined}
          placeholder={kind === "logs" ? "Opcional, por ejemplo backend" : "Opcional: nombre exacto de la instrumentación"}
          onChange={(event) => setInput(event.target.value)} />
      </label>
      <button className="secondary-button" disabled={state.loading}>Consultar</button>
      {filter && <button type="button" className="secondary-button" onClick={() => { setInput(""); setFilter(""); }}>Solo este incidente</button>}
    </form>
    <p className="incident-hint">{filter
      ? `Contexto de «${filter}» durante la ventana del incidente. Puede incluir actividad que no pertenece a este incidente.`
      : kind === "logs"
        ? "Eventos de la aplicación identificados con este incidente. Puedes consultar también el contexto de un servicio indicando su etiqueta exacta."
        : "Trazas capturadas en los eventos de este incidente. El nombre de un servicio monitorizado puede diferir de su nombre en Tempo."}</p>
    {state.loading && <p role="status">Consultando {kind === "logs" ? "Loki" : "las trazas"}…</p>}
    {state.error && <div className="alert alert--error" role="alert">{state.error}</div>}
    {state.data && <>
      {(kind === "logs" || filter) && <p className="incident-hint">Ventana de contexto: {date(state.data.window.start_at)} — {date(state.data.window.end_at)}.{state.data.window.truncated ? " Limitada a los últimos 7 días de la ventana del incidente." : " Incluye hasta 5 minutos antes de la creación y después de la resolución."}</p>}
      <p className="incident-hint">{items.length} resultados · Máximo {kind === "logs" ? 100 : 50}</p>
      {!items.length && <div className="incident-empty">{kind === "logs"
        ? "No hay logs disponibles para esta consulta. Los eventos antiguos pueden quedar fuera de la retención de Loki."
        : "No hay trazas para esta consulta. Se necesita instrumentación activa y datos conservados en Tempo."}</div>}
      <div className="incident-telemetry-list">{items.map((item, index) => kind === "logs"
        ? <article key={`${item.timestamp}-${index}`}>
          <div className="incident-event-meta"><time>{date(item.timestamp)}</time><span>{item.service} · {item.level}</span></div>
          <pre>{item.message}</pre>
          {item.trace_id && /^[a-f0-9]{32}$/i.test(item.trace_id) && !/^0+$/.test(item.trace_id) && <button type="button" className="secondary-button" onClick={() => onTrace(item.trace_id)}>Abrir traza</button>}
        </article>
        : <button type="button" className="incident-trace-row" key={item.trace_id}
          aria-pressed={selectedTrace === item.trace_id} onClick={() => setSelectedTrace(item.trace_id)}>
          <strong>{item.operation}</strong><code>{item.trace_id}</code>
          <span>{date(item.started_at)}{item.service ? ` · ${item.service}` : ""}{item.duration_ms != null ? ` · ${item.duration_ms} ms` : ""}</span>
        </button>)}</div>
    </>}
    {kind === "traces" && selectedTrace && <TraceDetail traceId={selectedTrace} />}
  </div>;
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
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
      if (version === requestVersion.current) setError(requestError.status === 404 ? "Este incidente no existe o ha sido eliminado." : requestError.message);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [incidentId]);
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
    <Link to="/incidentes" className="incident-back-link">← Todos los incidentes</Link>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {loading && !data && <p role="status">Cargando incidente…</p>}
    {!data && !loading && <button className="secondary-button" onClick={reload}>Reintentar</button>}
    {incident && <>
      <header className="topbar incident-detail-header">
        <div><p className="eyebrow">OPERACIONES / INCIDENTE #{incident.id}</p><h1>{incident.title}</h1>
          <div className="incident-detail-badges"><span className={`status-badge status-badge--${incident.status}`}>{statuses[incident.status] || incident.status}</span>
            <span className={`severity-badge severity-badge--${incident.severity}`}>{severities[incident.severity] || incident.severity}</span></div>
        </div>
        <button className="refresh-button" onClick={reload} disabled={loading || busy}>{loading ? "Actualizando…" : "Actualizar"}</button>
      </header>
      <section className="panel incident-context">
        <div><p className="eyebrow">SERVICIO AFECTADO</p>{data.service
          ? <><Link className="incident-service-link" to={`/servicios/${data.service.id}`}>{data.service.name} ↗</Link><p>{data.service.type} · Estado actual: {data.service.status}</p></>
          : <><strong>Servicio eliminado o sin asignar</strong><p>El historial del incidente se conserva.</p></>}
        </div>
        <div><span>Creado</span><strong>{date(incident.created_at)}</strong></div>
        <div><span>Resolución</span><strong>{incident.resolved_at ? date(incident.resolved_at) : "En curso"}</strong></div>
      </section>
      <section className="panel incident-description"><h2>Descripción</h2><p>{incident.description}</p>
        <div className="table-actions">
          {incident.status === "open" && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("investigating")}>Investigar</button>}
          {["open", "investigating"].includes(incident.status) && <button className="primary-button" disabled={busy || loading} onClick={() => changeStatus("resolved")}>Resolver</button>}
          {incident.status === "resolved" && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("closed")}>Cerrar</button>}
          {["resolved", "closed"].includes(incident.status) && <button className="secondary-button" disabled={busy || loading} onClick={() => changeStatus("open")}>Reabrir</button>}
        </div>
      </section>
      <section className="panel incident-investigation">
        <nav className="incident-tabs" aria-label="Información del incidente">{tabs.map(([key, label]) => <button key={key} type="button"
          aria-pressed={tab === key} onClick={() => { setTab(key); setTraceId(""); }}>
          {label}{key === "timeline" ? ` · ${data.timeline.total}` : key === "automations" ? ` · ${data.automations_total}` : ""}
        </button>)}</nav>
        <div className="incident-tab-content">
          {tab === "timeline" && <>
            <div className="incident-section-heading"><h2>Línea temporal</h2><span>Más reciente primero</span></div>
            <form className="incident-note-form" onSubmit={addNote}><label htmlFor="incident-note">Nota de investigación</label>
              <textarea id="incident-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={3} placeholder="Qué has observado y qué has comprobado…" required />
              <button className="secondary-button" disabled={busy || loading || !note.trim()}>{busy ? "Guardando…" : "Añadir nota"}</button>
            </form>
            {!data.timeline.events.length && <p className="incident-empty">Todavía no hay eventos registrados.</p>}
            <ol className="incident-timeline">{data.timeline.events.map((event) => <li key={event.id}>
              <div className="incident-event-meta"><time>{date(event.occurred_at)}</time><span>{event.actor_username || sources[event.source] || event.source}</span></div>
              <h3>{event.summary}</h3>
              {event.source === "legacy" && <p className="incident-hint">Fecha conservada del registro anterior; el autor y los pasos intermedios no constan.</p>}
              {event.changes?.text && <p className="incident-note-text">{event.changes.text}</p>}
              {Object.entries(event.changes || {}).filter(([, value]) => value && typeof value === "object" && "before" in value).map(([field, value]) => <details className="incident-change" key={field}>
                <summary>{fields[field] || field}</summary><div><del>{changeValue(field, value.before)}</del><span>→</span><strong>{changeValue(field, value.after)}</strong></div>
              </details>)}
              <div className="incident-event-actions">{event.automation_execution_id && <button className="secondary-button" onClick={() => setTab("automations")}>Ejecución #{event.automation_execution_id}</button>}
                {event.trace_id && <button className="secondary-button" onClick={() => openTrace(event.trace_id)}>Ver traza</button>}</div>
            </li>)}</ol>
            {data.timeline.events.length < data.timeline.total && <button className="secondary-button" disabled={busy || loading} onClick={() => loadMore("timeline")}>Cargar eventos anteriores</button>}
          </>}
          {tab === "automations" && <>
            <h2>Automatizaciones vinculadas</h2><p className="incident-hint">Ejecuciones asociadas al incidente por el disparador. Las ejecuciones antiguas sin vínculo explícito no se atribuyen automáticamente.</p>
            {!data.automations.length && <div className="incident-empty">Este incidente no tiene automatizaciones vinculadas.</div>}
            <div className="incident-automation-list">{data.automations.map((execution) => <article key={execution.id}>
              <div className="incident-section-heading"><h3>#{execution.id} · {execution.rule_name}</h3><span className={`incident-execution-state incident-execution-state--${execution.status}`}>{executionStatuses[execution.status] || execution.status}</span></div>
              <p>{date(execution.started_at)} · {execution.duration_ms != null ? `${execution.duration_ms.toFixed(2)} ms` : "En curso"}</p>
              {execution.error && <p role="status">{execution.error}</p>}
              <details><summary>Disparador y resultado</summary><pre>{JSON.stringify({ trigger: execution.trigger_type, payload: execution.trigger_payload, result: execution.result }, null, 2)}</pre></details>
            </article>)}</div>
            {data.automations.length < data.automations_total && <button className="secondary-button" disabled={busy || loading} onClick={() => loadMore("automations")}>Cargar más ejecuciones</button>}
          </>}
          {["logs", "traces"].includes(tab) && <>
            <h2>{tab === "logs" ? "Logs de Loki" : "Trazas de Tempo"}</h2>
            <Telemetry key={`${incidentId}-${tab}-${traceId}`} incidentId={incidentId} kind={tab} initialTraceId={traceId} onTrace={openTrace} refreshToken={data} />
          </>}
        </div>
      </section>
    </>}
  </div>;
}
