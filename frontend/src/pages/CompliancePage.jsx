import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const STATUS_LABELS = {
  passed: "Superado",
  failed: "Fallido",
};

const CATEGORY_LABELS = {
  authentication: "Autenticación",
  secrets: "Secretos",
  vulnerabilities: "Vulnerabilidades",
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


export default function CompliancePage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadCompliance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.getComplianceSummary();

      setSummary(response);
    } catch (requestError) {
      setError(
        requestError.message ||
        "No se pudo evaluar el cumplimiento.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);


  const score = summary?.score ?? 0;

  return (
    <section className="security-page compliance-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            SECURITY GOVERNANCE
          </p>

          <h1>Compliance</h1>

          <p className="subtitle">
            Evaluación automática de controles
            técnicos de seguridad de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadCompliance}
        >
          {loading
            ? "Evaluando..."
            : "Reevaluar"}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudo evaluar Compliance
          </strong>
          <span>{error}</span>
        </div>
      )}

      <section className="compliance-overview">
        <article className="panel compliance-score-card">
          <p className="eyebrow">
            SECURITY BASELINE
          </p>

          <div className="compliance-score">
            <strong>
              {loading ? "—" : `${score}%`}
            </strong>

            <span>
              puntuación de cumplimiento
            </span>
          </div>

          <div className="compliance-progress">
            <span
              style={{
                width: loading
                  ? "0%"
                  : `${score}%`,
              }}
            />
          </div>

          <p className="compliance-evaluated">
            Evaluado:{" "}
            <strong>
              {formatDate(summary?.evaluated_at)}
            </strong>
          </p>
        </article>

        <div className="metrics-grid compliance-metrics">
          <article className="metric-card">
            <span>Controles</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.total ?? 0}
            </strong>
            <p>Controles evaluados</p>
          </article>

          <article className="metric-card">
            <span>Superados</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.passed ?? 0}
            </strong>
            <p>Configuración conforme</p>
          </article>

          <article className="metric-card metric-card--danger">
            <span>Fallidos</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.failed ?? 0}
            </strong>
            <p>Requieren actuación</p>
          </article>
        </div>
      </section>

      <section className="panel compliance-controls-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              CONTROLES TÉCNICOS
            </p>

            <h2>Estado de cumplimiento</h2>

            <p>
              Evidencia y recomendación para cada
              control evaluado automáticamente.
            </p>
          </div>

          <span className="security-event-count">
            {summary?.controls?.length ?? 0} controles
          </span>
        </div>

        {loading ? (
          <div className="security-empty">
            Evaluando controles...
          </div>
        ) : !summary?.controls?.length ? (
          <div className="security-empty">
            <strong>
              No hay controles disponibles
            </strong>
          </div>
        ) : (
          <div className="compliance-controls">
            {summary.controls.map((control) => (
              <article
                key={control.control_id}
                className={
                  `compliance-control ` +
                  `compliance-control--${control.status}`
                }
              >
                <div className="compliance-control__header">
                  <div>
                    <span className="compliance-control__id">
                      {control.control_id}
                    </span>

                    <span className="compliance-control__category">
                      {CATEGORY_LABELS[control.category] ||
                        control.category}
                    </span>
                  </div>

                  <span
                    className={
                      `compliance-status ` +
                      `compliance-status--${control.status}`
                    }
                  >
                    {STATUS_LABELS[control.status] ||
                      control.status}
                  </span>
                </div>

                <h3>{control.title}</h3>

                <div className="compliance-control__detail">
                  <strong>Evidencia</strong>
                  <p>{control.evidence}</p>
                </div>

                <div className="compliance-control__detail">
                  <strong>Recomendación</strong>
                  <p>{control.recommendation}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
