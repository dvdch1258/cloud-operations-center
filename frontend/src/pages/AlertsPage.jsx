import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const SEVERITY_LABELS = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
  UNKNOWN: "Desconocida",
};

const STATUS_LABELS = {
  open: "Abierta",
  acknowledged: "Reconocida",
  resolved: "Resuelta",
};


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


export default function AlertsPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [component, setComponent] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");


  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 500,
      };

      if (status) {
        params.status = status;
      }

      if (severity) {
        params.severity = severity;
      }

      if (component) {
        params.component = component;
      }

      const [
        summaryResponse,
        alertsResponse,
      ] = await Promise.all([
        api.getSecurityAlertSummary(),
        api.getSecurityAlerts(params),
      ]);

      setSummary(summaryResponse);
      setAlerts(alertsResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudieron cargar las alertas.",
      );
    } finally {
      setLoading(false);
    }
  }, [status, severity, component]);


  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);


  async function changeAlertStatus(id, action) {
    setActionId(id);
    setError("");

    try {
      if (action === "acknowledge") {
        await api.acknowledgeSecurityAlert(id);
      } else {
        await api.resolveSecurityAlert(id);
      }

      await loadAlerts();
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo actualizar la alerta.",
      );
    } finally {
      setActionId(null);
    }
  }


  return (
    <section className="security-page alerts-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            SECURITY OPERATIONS
          </p>

          <h1>Alertas</h1>

          <p className="subtitle">
            Alertas de seguridad activas generadas
            automáticamente por la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadAlerts}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudieron procesar las alertas
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid alert-metrics">
        <article className="metric-card">
          <span>Total alertas</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.total ?? 0}
          </strong>
          <p>Histórico registrado</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>Abiertas</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.open ?? 0}
          </strong>
          <p>Pendientes de actuación</p>
        </article>

        <article className="metric-card">
          <span>Reconocidas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.acknowledged ?? 0}
          </strong>
          <p>En revisión</p>
        </article>

        <article className="metric-card">
          <span>Resueltas</span>
          <strong className="metric-card__value">
            {loading ? "—" : summary?.resolved ?? 0}
          </strong>
          <p>Sin riesgo activo</p>
        </article>

        <article className="metric-card metric-card--danger">
          <span>Críticas activas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.critical_active ?? 0}
          </strong>
          <p>Prioridad inmediata</p>
        </article>

        <article className="metric-card metric-card--warning">
          <span>Altas activas</span>
          <strong className="metric-card__value">
            {loading
              ? "—"
              : summary?.high_active ?? 0}
          </strong>
          <p>Riesgo elevado</p>
        </article>
      </div>

      <section className="panel alerts-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              SECURITY ALERTING
            </p>

            <h2>Alertas detectadas</h2>

            <p>
              Estado operativo de los riesgos
              detectados automáticamente.
            </p>
          </div>

          <span className="security-event-count">
            {alerts.length} resultados
          </span>
        </div>

        <div className="vulnerability-filters">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">Todos los estados</option>
            <option value="open">Abiertas</option>
            <option value="acknowledged">
              Reconocidas
            </option>
            <option value="resolved">Resueltas</option>
          </select>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <option value="">Todas las severidades</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>

          <select
            value={component}
            onChange={(event) =>
              setComponent(event.target.value)
            }
          >
            <option value="">Todos los componentes</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
          </select>
        </div>

        <p className="vulnerability-scan-date">
          Última actividad:{" "}
          <strong>
            {formatDate(summary?.last_seen_at)}
          </strong>
        </p>
        {loading ? (
          <div className="security-empty">
            Cargando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="security-empty">
            <strong>
              No hay alertas para estos filtros
            </strong>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table className="security-table alert-table">
              <thead>
                <tr>
                  <th>Severidad</th>
                  <th>Alerta</th>
                  <th>Componente</th>
                  <th>Paquete</th>
                  <th>Estado</th>
                  <th>Última detección</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span
                        className={
                          `security-severity ` +
                          `security-severity--${alert.severity.toLowerCase()}`
                        }
                      >
                        {SEVERITY_LABELS[alert.severity] ||
                          alert.severity}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {alert.vulnerability_id ||
                          alert.title}
                      </strong>

                      <span className="security-event-description">
                        {alert.title}
                      </span>
                    </td>

                    <td>
                      {alert.component || "—"}
                    </td>

                    <td>
                      {alert.package_name || "—"}
                    </td>

                    <td>
                      <span
                        className={
                          `security-alert-status ` +
                          `security-alert-status--${alert.status}`
                        }
                      >
                        {STATUS_LABELS[alert.status] ||
                          alert.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(alert.last_seen_at)}
                    </td>

                    <td>
                      <div className="security-alert-actions">
                        {alert.status === "open" && (
                          <button
                            type="button"
                            className="security-alert-action"
                            disabled={actionId === alert.id}
                            onClick={() =>
                              changeAlertStatus(
                                alert.id,
                                "acknowledge",
                              )
                            }
                          >
                            Reconocer
                          </button>
                        )}

                        {alert.status !== "resolved" && (
                          <button
                            type="button"
                            className="security-alert-action security-alert-action--resolve"
                            disabled={actionId === alert.id}
                            onClick={() =>
                              changeAlertStatus(
                                alert.id,
                                "resolve",
                              )
                            }
                          >
                            Resolver
                          </button>
                        )}

                        {alert.status === "resolved" && (
                          <span className="security-alert-no-action">
                            Sin acciones
                          </span>
                        )}
                      </div>
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
