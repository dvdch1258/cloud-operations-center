import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { controlText } from "../i18n/securityContent";


const statusKeys = new Set([
  "passed",
  "failed",
]);

const categoryKeys = new Set([
  "authentication",
  "secrets",
  "vulnerabilities",
]);


function statusLabel(value, t) {
  return statusKeys.has(value)
    ? t(`compliance.status.${value}`)
    : value;
}


function categoryLabel(value, t) {
  return categoryKeys.has(value)
    ? t(`compliance.category.${value}`)
    : value;
}


function localeForLanguage(language) {
  return String(language || "")
    .toLowerCase()
    .startsWith("es")
    ? "es-ES"
    : "en-GB";
}


function formatDate(value, language) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    localeForLanguage(language),
    {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
      minute: "2-digit",
    },
  );
}


export default function CompliancePage() {
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;

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
        t("compliance.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);


  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);


  const score = summary?.score ?? 0;

  return (
    <section className="security-page compliance-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {t("compliance.eyebrow")}
          </p>

          <h1>{t("compliance.title")}</h1>

          <p className="subtitle">
            {t("compliance.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadCompliance}
        >
          {loading
            ? t("compliance.evaluating")
            : t("compliance.reevaluate")}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            {t("compliance.errors.heading")}
          </strong>
          <span>{error}</span>
        </div>
      )}

      <section className="compliance-overview">
        <article className="panel compliance-score-card">
          <p className="eyebrow">
            {t("compliance.score.eyebrow")}
          </p>

          <div className="compliance-score">
            <strong>
              {loading ? "—" : `${score}%`}
            </strong>

            <span>
              {t("compliance.score.label")}
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
            {t("compliance.score.evaluated")}{" "}
            <strong>
              {formatDate(
                summary?.evaluated_at,
                language,
              )}
            </strong>
          </p>
        </article>

        <div className="metrics-grid compliance-metrics">
          <article className="metric-card">
            <span>{t("compliance.kpi.controls")}</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.total ?? 0}
            </strong>
            <p>{t("compliance.kpi.controlsDescription")}</p>
          </article>

          <article className="metric-card">
            <span>{t("compliance.kpi.passed")}</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.passed ?? 0}
            </strong>
            <p>{t("compliance.kpi.passedDescription")}</p>
          </article>

          <article className="metric-card metric-card--danger">
            <span>{t("compliance.kpi.failed")}</span>
            <strong className="metric-card__value">
              {loading ? "—" : summary?.failed ?? 0}
            </strong>
            <p>{t("compliance.kpi.failedDescription")}</p>
          </article>
        </div>
      </section>

      <section className="panel compliance-controls-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              {t("compliance.controls.eyebrow")}
            </p>

            <h2>{t("compliance.controls.title")}</h2>

            <p>
              {t("compliance.controls.description")}
            </p>
          </div>

          <span className="security-event-count">
            {t(
              "compliance.controls.count",
              {
                count:
                  summary?.controls?.length ?? 0,
              },
            )}
          </span>
        </div>

        {loading ? (
          <div className="security-empty">
            {t("compliance.controls.loading")}
          </div>
        ) : !summary?.controls?.length ? (
          <div className="security-empty">
            <strong>
              {t("compliance.controls.empty")}
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
                      {categoryLabel(
                        control.category,
                        t,
                      )}
                    </span>
                  </div>

                  <span
                    className={
                      `compliance-status ` +
                      `compliance-status--${control.status}`
                    }
                  >
                    {statusLabel(
                      control.status,
                      t,
                    )}
                  </span>
                </div>

                <h3>{controlText(control, "title", language)}</h3>

                <div className="compliance-control__detail">
                  <strong>
                    {t("compliance.controls.evidence")}
                  </strong>
                  <p>{controlText(control, "evidence", language)}</p>
                </div>

                <div className="compliance-control__detail">
                  <strong>
                    {t("compliance.controls.recommendation")}
                  </strong>
                  <p>{controlText(control, "recommendation", language)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
