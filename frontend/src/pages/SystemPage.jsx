import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

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


function statusLabel(status, t) {
  const normalized =
    String(status).toLowerCase();

  if (
    ["ok", "up", "healthy"].includes(normalized)
  ) {
    return t("system.status.operational");
  }

  if (
    ["down", "degraded", "unhealthy"].includes(
      normalized,
    )
  ) {
    return normalized === "degraded"
      ? t("system.status.degraded")
      : t("system.status.unavailable");
  }

  return t("system.status.noData");
}


function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


function formatTime(value, language) {
  if (!value) {
    return "—";
  }

  return value.toLocaleTimeString(
    localeForLanguage(language),
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function ComponentRow({
  name,
  description,
  status,
  t,
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
        {statusLabel(status, t)}
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
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;

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
        setError(
          requestError.message ||
            t("system.errors.load"),
        );
      } finally {
        setLoading(false);
      }
    }, [t]);


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
            {t("system.eyebrow")}
          </p>

          <h1>{t("system.title")}</h1>

          <p className="subtitle">
            {t("system.subtitle")}
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadHealth}
          disabled={loading}
        >
          {loading
            ? t("system.refreshing")
            : t("system.refresh")}
        </button>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            {t("system.errors.heading")}
          </strong>

          <span>{error}</span>
        </section>
      )}


      <section className="platform-status system-platform-status">
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
                ? t("system.platform.operational")
                : t("system.platform.degraded")}
            </strong>

            <p>
              {lastUpdated
                ? t("system.platform.lastUpdated", {
                    time: formatTime(
                      lastUpdated,
                      language,
                    ),
                  })
                : t("system.platform.waitingData")}
            </p>
          </div>
        </div>

        <span className="environment-badge">
          {health.environment}
        </span>
      </section>


      <section className="system-meta-grid">
        <MetaCard
          label={t("system.meta.version")}
          value={`v${health.version}`}
          description={t(
            "system.meta.versionDescription",
          )}
        />

        <MetaCard
          label={t("system.meta.build")}
          value={shortBuild}
          description={t(
            "system.meta.buildDescription",
          )}
        />

        <MetaCard
          label={t("system.meta.environment")}
          value={health.environment}
          description={t(
            "system.meta.environmentDescription",
          )}
        />

        <MetaCard
          label={t("system.meta.orchestration")}
          value="Kubernetes"
          description={t(
            "system.meta.orchestrationDescription",
          )}
        />
      </section>


      <section className="operations-grid system-operations-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h2>
                {t("system.components.title")}
              </h2>

              <span>
                {t("system.components.description")}
              </span>
            </div>
          </div>

          <div className="component-list">
            <ComponentRow
              name="PostgreSQL"
              description={t(
                "system.components.databaseDescription",
              )}
              status={health.database}
              t={t}
            />

            <ComponentRow
              name="Prometheus"
              description={t(
                "system.components.prometheusDescription",
              )}
              status={health.prometheus}
              t={t}
            />

            <ComponentRow
              name="Tempo"
              description={t(
                "system.components.tempoDescription",
              )}
              status={health.tempo}
              t={t}
            />
          </div>
        </article>


        <article className="panel panel--observability">
          <h2>{t("system.observability.title")}</h2>

          <p>
            {t("system.observability.description")}
          </p>

          <div className="system-links">
            <a
              className="grafana-link"
              href="https://grafana.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              {t("system.observability.openGrafana")}
            </a>

            <a
              className="grafana-link"
              href="https://prometheus.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              {t("system.observability.openPrometheus")}
            </a>

            <a
              className="grafana-link"
              href="https://argocd.cloudopscenter.es"
              target="_blank"
              rel="noreferrer"
            >
              {t("system.observability.openArgoCd")}
            </a>
          </div>
        </article>
      </section>


      <section className="panel system-stack">
        <div className="panel__header">
          <div>
            <h2>
              {t("system.architecture.title")}
            </h2>

            <span>
              {t("system.architecture.description")}
            </span>
          </div>
        </div>

        <div className="system-stack-grid">
          <div>
            <span>{t("system.architecture.application")}</span>
            <strong>
              React · FastAPI
            </strong>
          </div>

          <div>
            <span>{t("system.architecture.persistence")}</span>
            <strong>PostgreSQL</strong>
          </div>

          <div>
            <span>{t("system.architecture.gitops")}</span>
            <strong>Argo CD</strong>
          </div>

          <div>
            <span>{t("system.architecture.metrics")}</span>
            <strong>
              Prometheus · Grafana
            </strong>
          </div>

          <div>
            <span>{t("system.architecture.logs")}</span>
            <strong>
              Alloy · Loki
            </strong>
          </div>

          <div>
            <span>{t("system.architecture.tracing")}</span>
            <strong>
              OpenTelemetry · Tempo
            </strong>
          </div>

          <div>
            <span>{t("system.architecture.alerts")}</span>
            <strong>
              Alertmanager · Telegram
            </strong>
          </div>

          <div>
            <span>{t("system.architecture.automation")}</span>
            <strong>
              Service Checker · n8n
            </strong>
          </div>
        </div>
      </section>
    </>
  );
}
