import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { policyText, policySource } from "../i18n/securityContent";


const categoryKeys = new Set([
  "authentication",
  "vulnerabilities",
  "scanning",
]);

const unitKeys = new Set([
  "attempts",
  "minutes",
  "hours",
]);


function categoryLabel(value, t) {
  return categoryKeys.has(value)
    ? t(`policies.category.${value}`)
    : value;
}


function formatValue(policy, t) {
  if (typeof policy.value === "boolean") {
    return policy.value
      ? t("policies.values.enabled")
      : t("policies.values.disabled");
  }

  const unit = unitKeys.has(policy.unit)
    ? t(`policies.units.${policy.unit}`)
    : null;

  return unit
    ? `${policy.value} ${unit}`
    : String(policy.value);
}


export default function PoliciesPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.getSecurityPolicies();

      setData(response);
    } catch (requestError) {
      setError(
        requestError.message ||
        t("policies.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);


  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);


  return (
    <section className="security-page policies-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {t("policies.eyebrow")}
          </p>

          <h1>{t("policies.title")}</h1>

          <p className="subtitle">
            {t("policies.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadPolicies}
        >
          {loading
            ? t("policies.loading")
            : t("policies.refresh")}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            {t("policies.errors.heading")}
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid policies-metrics">
        <article className="metric-card">
          <span>{t("policies.kpi.policies")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.total ?? 0}
          </strong>
          <p>{t("policies.kpi.policiesDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("policies.kpi.active")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.enabled ?? 0}
          </strong>
          <p>{t("policies.kpi.activeDescription")}</p>
        </article>

        <article className="metric-card">
          <span>{t("policies.kpi.enforced")}</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.enforced ?? 0}
          </strong>
          <p>{t("policies.kpi.enforcedDescription")}</p>
        </article>
      </div>

      <section className="panel policies-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              {t("policies.inventory.eyebrow")}
            </p>

            <h2>{t("policies.inventory.title")}</h2>

            <p>
              {t("policies.inventory.description")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="security-empty">
            {t("policies.inventory.loading")}
          </div>
        ) : !data?.policies?.length ? (
          <div className="security-empty">
            {t("policies.inventory.empty")}
          </div>
        ) : (
          <div className="policies-list">
            {data.policies.map((policy) => (
              <article
                key={policy.policy_id}
                className="policy-card"
              >
                <div className="policy-card__header">
                  <div>
                    <span className="policy-card__id">
                      {policy.policy_id}
                    </span>

                    <span className="policy-card__category">
                      {categoryLabel(
                        policy.category,
                        t,
                      )}
                    </span>
                  </div>

                  <span className="policy-enforcement">
                    {t("policies.inventory.applied")}
                  </span>
                </div>

                <div className="policy-card__content">
                  <div>
                    <h3>{policyText(policy, "name", language)}</h3>
                    <p>{policyText(policy, "description", language)}</p>
                  </div>

                  <strong className="policy-card__value">
                    {formatValue(policy, t)}
                  </strong>
                </div>

                <div className="policy-card__meta">
                  {t(
                    "policies.inventory.source",
                    { source: policySource(policy.source, language) },
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
