import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const initialHealth = {
  status: "unknown",
  database: "unknown",
  prometheus: "unknown",
  tempo: "unknown",
  version: "—",
  build_sha: "—",
  environment: "—",
  timestamp: null,
};


function statusIsUp(status) {
  return ["ok", "up", "healthy"].includes(
    String(status).toLowerCase(),
  );
}


function statusLabel(status) {
  const normalized =
    String(status).toLowerCase();

  if (
    ["ok", "up", "healthy"].includes(normalized)
  ) {
    return "Operativo";
  }

  if (
    ["down", "degraded", "unhealthy"].includes(
      normalized,
    )
  ) {
    return normalized === "degraded"
      ? "Degradado"
      : "No disponible";
  }

  return "Sin datos";
}


function ComponentRow({
  name,
  description,
  status,
}) {
  const healthy = statusIsUp(status);

  return (
    <div className="component-row">
      <span
        className={
          healthy
            ? "status-dot status-dot--up"
            : "status-dot status-dot--down"
        }
      />

      <div>
        <strong>{name}</strong>
        <span>{description}</span>
      </div>

      <span
        className={
          healthy
            ? "component-status"
            : "component-status component-status--down"
        }
      >
        {statusLabel(status)}
      </span>
    </div>
  );
}


function MetaCard({
  label,
  value,
  description,
}) {
  return (
    <article className="system-meta-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}


export default function SystemPage() {
  const [health, setHealth] =
    useState(initialHealth);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);


  const loadHealth =
    useCallback(async () => {
      setError("");

      try {
        const data =
          await api.getDetailedHealth();

        setHealth(data);
        setLastUpdated(new Date());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadHealth();

    const interval =
      window.setInterval(
        loadHealth,
        30000,
      );

    return () =>
      window.clearInterval(interval);
  }, [loadHealth]);


  const operational =
    !error &&
    health.status === "ok";

  const shortBuild =
    health.build_sha === "development"
      ? "development"
      : String(health.build_sha)
          .replace(/^sha-/, "")
          .slice(0, 12);


  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            PLATAFORMA
          </p>

          <h1>Sistema</h1>

          <p className="subtitle">
            Información de versión,
            infraestructura y salud de la
            plataforma.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadHealth}
          disabled={loading}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            No se pudo obtener el estado
            del sistema
          </strong>

          <span>{error}</span>
        </section>
      )}


      <section className="platform-status">
        <div>
          <span
            className={
              operational
                ? "status-dot status-dot--up"
                : "status-dot status-dot--down"
            }
          />

          <div>
            <strong>
              {operational
                ? "Plataforma operativa"
                : "Plataforma degradada"}
            </strong>

            <p>
              {lastUpdated
                ? `Última actualización: ${lastUpdated.toLocaleTimeString()}`
                : "Esperando datos"}
            </p>
          </div>
        </div>

        <span className="environment-badge">
          {health.environment}
        </span>
      </section>


      <section className="system-meta-grid">
        <MetaCard
          label="Versión"
          value={`v${health.version}`}
          description="Release de la aplicación"
        />

        <MetaCard
          label="Build"
          value={shortBuild}
          description="Commit desplegado"
        />

        <MetaCard
          label="Entorno"
          value={health.environment}
          description="Entorno de ejecución"
        />

        <MetaCard
          label="Orquestación"
          value="Kubernetes"
          description="Namespace cloud-ops"
        />
      </section>


      <section className="operations-grid system-operations-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h2>
                Salud de componentes
              </h2>

              <span>
                Comprobaciones obtenidas
                desde el backend
              </span>
            </div>
          </div>

          <div className="component-list">
            <ComponentRow
              name="PostgreSQL"
              description="Persistencia principal"
              status={health.database}
            />

            <ComponentRow
              name="Prometheus"
              description="Métricas y alertas"
              status={health.prometheus}
            />

            <ComponentRow
              name="Tempo"
              description="Trazas distribuidas"
              status={health.tempo}
            />
          </div>
        </article>


        <article className="panel panel--observability">
          <h2>Observabilidad</h2>

          <p>
            Acceso a las herramientas
            operativas de la plataforma.
          </p>

          <div className="system-links">
            <a
              className="grafana-link"
              href="https://grafana.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Grafana
            </a>

            <a
              className="grafana-link"
              href="https://prometheus.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Prometheus
            </a>

            <a
              className="grafana-link"
              href="https://argocd.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Argo CD
            </a>
          </div>
        </article>
      </section>


      <section className="panel system-stack">
        <div className="panel__header">
          <div>
            <h2>
              Arquitectura operacional
            </h2>

            <span>
              Componentes principales del
              Cloud Operations Center
            </span>
          </div>
        </div>

        <div className="system-stack-grid">
          <div>
            <span>Aplicación</span>
            <strong>
              React · FastAPI
            </strong>
          </div>

          <div>
            <span>Persistencia</span>
            <strong>PostgreSQL</strong>
          </div>

          <div>
            <span>GitOps</span>
            <strong>Argo CD</strong>
          </div>

          <div>
            <span>Métricas</span>
            <strong>
              Prometheus · Grafana
            </strong>
          </div>

          <div>
            <span>Logs</span>
            <strong>
              Alloy · Loki
            </strong>
          </div>

          <div>
            <span>Tracing</span>
            <strong>
              OpenTelemetry · Tempo
            </strong>
          </div>

          <div>
            <span>Alertas</span>
            <strong>
              Alertmanager · Telegram
            </strong>
          </div>

          <div>
            <span>Automatización</span>
            <strong>
              Service Checker · n8n
            </strong>
          </div>
        </div>
      </section>
    </>
  );
}
