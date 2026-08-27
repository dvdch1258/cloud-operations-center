import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../api/client";


const CATEGORY_LABELS = {
  authentication: "Autenticación",
  vulnerabilities: "Vulnerabilidades",
  scanning: "Escaneo",
};

const UNIT_LABELS = {
  attempts: "intentos",
  minutes: "minutos",
  hours: "horas",
};


function formatValue(policy) {
  if (typeof policy.value === "boolean") {
    return policy.value ? "Activado" : "Desactivado";
  }

  const unit = UNIT_LABELS[policy.unit];

  return unit
    ? `${policy.value} ${unit}`
    : String(policy.value);
}


export default function PoliciesPage() {
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
        "No se pudieron cargar las políticas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);


  return (
    <section className="security-page policies-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            SECURITY GOVERNANCE
          </p>

          <h1>Policies</h1>

          <p className="subtitle">
            Políticas técnicas que gobiernan la
            seguridad de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          disabled={loading}
          onClick={loadPolicies}
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="alert alert--error">
          <strong>
            No se pudieron cargar las políticas
          </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="metrics-grid policies-metrics">
        <article className="metric-card">
          <span>Políticas</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.total ?? 0}
          </strong>
          <p>Políticas definidas</p>
        </article>

        <article className="metric-card">
          <span>Activas</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.enabled ?? 0}
          </strong>
          <p>Actualmente habilitadas</p>
        </article>

        <article className="metric-card">
          <span>Enforced</span>
          <strong className="metric-card__value">
            {loading ? "—" : data?.enforced ?? 0}
          </strong>
          <p>Aplicadas por el backend</p>
        </article>
      </div>

      <section className="panel policies-panel">
        <div className="security-panel-header">
          <div>
            <p className="eyebrow">
              EFFECTIVE POLICIES
            </p>

            <h2>Políticas aplicadas</h2>

            <p>
              Configuración efectiva utilizada por
              los controles de seguridad.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="security-empty">
            Cargando políticas...
          </div>
        ) : !data?.policies?.length ? (
          <div className="security-empty">
            No hay políticas disponibles.
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
                      {CATEGORY_LABELS[policy.category] ||
                        policy.category}
                    </span>
                  </div>

                  <span className="policy-enforcement">
                    Aplicada
                  </span>
                </div>

                <div className="policy-card__content">
                  <div>
                    <h3>{policy.name}</h3>
                    <p>{policy.description}</p>
                  </div>

                  <strong className="policy-card__value">
                    {formatValue(policy)}
                  </strong>
                </div>

                <div className="policy-card__meta">
                  Fuente: {policy.source}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
