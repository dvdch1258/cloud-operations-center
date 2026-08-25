import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const EVENT_LABELS = {
  login_success: "Inicio de sesión",
  login_failed: "Login fallido",
  login_blocked: "Login bloqueado",
  account_locked: "Cuenta bloqueada",
  account_unlocked: "Cuenta desbloqueada",
};


const SEVERITY_LABELS = {
  info: "Info",
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};


function formatEventType(value) {
  return EVENT_LABELS[value] || value;
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "es-ES",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


export default function SecurityPage() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  const loadSecurity = useCallback(async ({
    refresh = false,
  } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        summaryResponse,
        eventsResponse,
      ] = await Promise.all([
        api.getSecuritySummary(),
        api.getSecurityEvents(50),
      ]);

      setSummary(summaryResponse);
      setEvents(eventsResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo cargar la información de seguridad.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);


  const hasActiveLockouts =
    (summary?.locked_users || 0) > 0;


  return (
    <section className="security-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            SECURITY OPERATIONS
          </p>

          <h1>Seguridad</h1>

          <p className="subtitle">
            Actividad de autenticación,
            bloqueos y eventos de seguridad
            de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={refreshing}
          onClick={() =>
            loadSecurity({ refresh: true })
          }
        >
          {refreshing
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudo cargar Seguridad
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="platform-status security-status">
        <div>
          <span
            className={
              hasActiveLockouts
                ? "status-dot status-dot--warning"
                : "status-dot status-dot--up"
            }
          />

          <div>
            <strong>
              {hasActiveLockouts
                ? "Actividad de seguridad detectada"
                : "Sin bloqueos activos"}
            </strong>

            <p>
              Monitorización de autenticación
              y protección de cuentas
            </p>
          </div>
        </div>

        <span className="environment-badge">
          Producción
        </span>
      </div>

      <div className="metrics-grid security-metrics">
        <article className="metric-card metric-card--neutral">
          <div className="metric-card__header">
            <span>Eventos · 24h</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.events_last_24h ?? 0}
          </strong>

          <p>
            Actividad registrada durante
            las últimas 24 horas
          </p>
        </article>

        <article
          className={
            (summary?.failed_logins_last_24h || 0) > 0
              ? "metric-card metric-card--warning"
              : "metric-card metric-card--neutral"
          }
        >
          <div className="metric-card__header">
            <span>Logins fallidos · 24h</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.failed_logins_last_24h ?? 0}
          </strong>

          <p>
            Credenciales incorrectas
            o usuarios inexistentes
          </p>
        </article>

        <article
          className={
            (summary?.locked_users || 0) > 0
              ? "metric-card metric-card--danger"
              : "metric-card metric-card--neutral"
          }
        >
          <div className="metric-card__header">
            <span>Cuentas bloqueadas</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.locked_users ?? 0}
          </strong>

          <p>
            Usuarios actualmente bajo
            bloqueo temporal
          </p>
        </article>

        <article className="metric-card">
          <div className="metric-card__header">
            <span>Usuarios activos</span>
            <span className="metric-card__indicator" />
          </div>

          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.active_users ?? 0}
          </strong>

          <p>
            Cuentas habilitadas
            en Cloud Operations
          </p>
        </article>
      </div>

      <section className="panel security-events-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              AUDITORÍA
            </p>

            <h2>
              Eventos de seguridad recientes
            </h2>

            <p>
              Últimos eventos registrados
              por el sistema de autenticación.
            </p>
          </div>

          <span className="security-event-count">
            {events.length} eventos
          </span>
        </div>

        {loading ? (
          <div className="security-empty">
            Cargando eventos de seguridad...
          </div>
        ) : events.length === 0 ? (
          <div className="security-empty">
            <strong>
              Todavía no hay eventos registrados
            </strong>
            <span>
              Los próximos inicios de sesión
              aparecerán aquí.
            </span>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Severidad</th>
                  <th>Evento</th>
                  <th>Usuario</th>
                  <th>Origen</th>
                  <th>IP</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <span
                        className={
                          `security-severity ` +
                          `security-severity--${event.severity}`
                        }
                      >
                        {SEVERITY_LABELS[event.severity] ||
                          event.severity}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {formatEventType(
                          event.event_type,
                        )}
                      </strong>

                      <span className="security-event-description">
                        {event.description}
                      </span>
                    </td>

                    <td>
                      {event.username || "—"}
                    </td>

                    <td>
                      {event.source || "—"}
                    </td>

                    <td className="security-ip">
                      {event.ip_address || "—"}
                    </td>

                    <td>
                      {formatDate(event.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
