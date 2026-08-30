import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api/client";


const initialForm = {
  name: "",
  description: "",
  serviceId: "",
  triggerType: "service_down",
};


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}


function formatDuration(value) {
  const duration = Number(value);

  if (!Number.isFinite(duration)) {
    return "—";
  }

  if (duration < 1000) {
    return `${duration.toFixed(1)} ms`;
  }

  return `${(duration / 1000).toFixed(2)} s`;
}


function executionStatusLabel(status) {
  switch (status) {
    case "success":
      return "Completada";
    case "failed":
      return "Fallida";
    case "running":
      return "En ejecución";
    default:
      return status || "Desconocido";
  }
}


function triggerLabel(trigger) {
  if (trigger === "service_down") {
    return "Servicio caído";
  }

  if (trigger === "service_recovered") {
    return "Servicio recuperado";
  }

  return trigger || "—";
}


function actionLabel(action) {
  if (action === "notify_webhook") {
    return "Notificar webhook";
  }

  return action || "—";
}


function executionSourceLabel(source) {
  if (source === "manual_test") {
    return "Prueba manual";
  }

  if (source === "trigger") {
    return "Automática";
  }

  return source || "—";
}


function SummaryCard({
  label,
  value,
  description,
}) {
  return (
    <article className="automation-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}


export default function AutomationsPage() {
  const [rules, setRules] =
    useState([]);

  const [executions, setExecutions] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [busyRuleId, setBusyRuleId] =
    useState(null);

  const [
    testingRuleId,
    setTestingRuleId,
  ] = useState(null);

  const [
    testServiceByRule,
    setTestServiceByRule,
  ] = useState({});

  const [statusFilter, setStatusFilter] =
    useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const loadData =
    useCallback(async () => {
      setError("");

      try {
        const [
          rulesData,
          executionsData,
          servicesData,
        ] = await Promise.all([
          api.getAutomationRules({
            limit: 100,
          }),
          api.getAutomationExecutions({
            limit: 100,
          }),
          api.getServices(),
        ]);

        setRules(rulesData);
        setExecutions(executionsData);
        setServices(servicesData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);


  function serviceName(serviceId) {
    if (serviceId === null) {
      return "Todos los servicios";
    }

    const service = services.find(
      (item) => item.id === serviceId
    );

    return service
      ? service.name
      : `Servicio #${serviceId}`;
  }


  async function handleCreate(event) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name || saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.createAutomationRule({
        name,
        description:
          form.description.trim() || null,
        enabled: true,
        trigger_type: form.triggerType,
        action_type: "notify_webhook",
        service_id: form.serviceId
          ? Number(form.serviceId)
          : null,
      });

      setForm(initialForm);

      setSuccessMessage(
        "Automatización creada correctamente."
      );

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }


  async function handleToggle(rule) {
    if (busyRuleId !== null) {
      return;
    }

    setBusyRuleId(rule.id);
    setError("");
    setSuccessMessage("");

    try {
      await api.updateAutomationRule(
        rule.id,
        {
          enabled: !rule.enabled,
        },
      );

      setSuccessMessage(
        rule.enabled
          ? "Automatización desactivada."
          : "Automatización activada."
      );

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyRuleId(null);
    }
  }


  async function handleTest(rule) {
    if (busyRuleId !== null) {
      return;
    }

    let serviceId = rule.service_id;

    if (serviceId === null) {
      const selectedServiceId =
        testServiceByRule[rule.id];

      if (!selectedServiceId) {
        setError(
          "Selecciona un servicio para probar " +
          "esta regla global."
        );
        return;
      }

      serviceId = Number(selectedServiceId);
    }

    setBusyRuleId(rule.id);
    setTestingRuleId(rule.id);
    setError("");
    setSuccessMessage("");

    try {
      const execution =
        await api.testAutomationRule(
          rule.id,
          {
            service_id: serviceId,
          },
        );

      if (execution.status === "success") {
        setSuccessMessage(
          `Prueba de "${rule.name}" ` +
          "completada correctamente."
        );
      } else {
        setError(
          execution.error ||
          `La prueba de "${rule.name}" falló.`
        );
      }

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTestingRuleId(null);
      setBusyRuleId(null);
    }
  }


  async function handleDelete(rule) {
    if (busyRuleId !== null) {
      return;
    }

    const confirmed =
      window.confirm(
        `¿Eliminar la automatización "${rule.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setBusyRuleId(rule.id);
    setError("");
    setSuccessMessage("");

    try {
      await api.deleteAutomationRule(
        rule.id
      );

      setSuccessMessage(
        "Automatización eliminada. " +
        "Su historial permanece disponible."
      );

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyRuleId(null);
    }
  }


  const activeRules =
    useMemo(
      () =>
        rules.filter(
          (rule) => rule.enabled
        ).length,
      [rules],
    );


  const failedExecutions =
    useMemo(
      () =>
        executions.filter(
          (execution) =>
            execution.status === "failed"
        ).length,
      [executions],
    );


  const visibleExecutions =
    useMemo(() => {
      if (!statusFilter) {
        return executions;
      }

      return executions.filter(
        (execution) =>
          execution.status === statusFilter
      );
    }, [
      executions,
      statusFilter,
    ]);


  const latestExecution =
    executions[0] || null;


  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            AUTOMATION
          </p>

          <h1>Automatizaciones</h1>

          <p className="subtitle">
            Define reglas operativas y consulta
            cada ejecución realizada por la
            plataforma.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadData}
          disabled={loading || saving}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            No se pudo completar la acción
          </strong>

          <span>{error}</span>
        </section>
      )}


      {successMessage && (
        <section className="alert alert--success">
          <strong>
            Automation
          </strong>

          <span>{successMessage}</span>
        </section>
      )}


      <section className="automation-summary-grid">
        <SummaryCard
          label="Reglas"
          value={rules.length}
          description="Automatizaciones configuradas"
        />

        <SummaryCard
          label="Activas"
          value={activeRules}
          description="Reglas evaluadas por el motor"
        />

        <SummaryCard
          label="Ejecuciones"
          value={executions.length}
          description="Historial registrado"
        />

        <SummaryCard
          label="Fallidas"
          value={failedExecutions}
          description="Acciones que requieren revisión"
        />
      </section>


      <section className="automation-main-grid">
        <article className="panel automation-create-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">
                NUEVA REGLA
              </p>

              <h2>
                Crear automatización
              </h2>

              <span>
                Define cuándo debe reaccionar
                automáticamente la plataforma.
              </span>
            </div>
          </div>


          <form
            className="automation-form"
            onSubmit={handleCreate}
          >
            <label>
              <span>Nombre</span>

              <input
                type="text"
                value={form.name}
                placeholder="Ej. Avisar caída Backend API"
                maxLength={150}
                required
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>


            <label>
              <span>Descripción</span>

              <textarea
                value={form.description}
                placeholder={
                  "Describe brevemente qué " +
                  "hace esta automatización."
                }
                rows={3}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
              />
            </label>


            <label>
              <span>Servicio</span>

              <select
                value={form.serviceId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serviceId:
                      event.target.value,
                  }))
                }
              >
                <option value="">
                  Todos los servicios
                </option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>
            </label>


            <div className="automation-fixed-grid">
              <div>
                <span>Trigger</span>

                <select
                  value={form.triggerType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      triggerType:
                        event.target.value,
                    }))
                  }
                >
                  <option value="service_down">
                    Servicio caído
                  </option>

                  <option value="service_recovered">
                    Servicio recuperado
                  </option>
                </select>
              </div>

              <div>
                <span>Acción</span>
                <strong>
                  Notificar webhook
                </strong>
              </div>
            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={
                saving ||
                !form.name.trim()
              }
            >
              {saving
                ? "Creando..."
                : "Crear automatización"}
            </button>
          </form>
        </article>


        <article className="panel automation-engine-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">
                MOTOR
              </p>

              <h2>Estado de Automation</h2>

              <span>
                Flujo operativo de las reglas
                configuradas.
              </span>
            </div>
          </div>


          <div className="automation-engine-flow">
            <div>
              <span>1</span>
              <strong>Detectar</strong>
              <p>
                El checker detecta una transición
                real hacia down.
              </p>
            </div>

            <div>
              <span>2</span>
              <strong>Evaluar</strong>
              <p>
                El motor localiza las reglas
                activas aplicables al servicio.
              </p>
            </div>

            <div>
              <span>3</span>
              <strong>Actuar</strong>
              <p>
                La acción configurada se ejecuta
                mediante el webhook seguro.
              </p>
            </div>

            <div>
              <span>4</span>
              <strong>Auditar</strong>
              <p>
                Resultado, duración y errores
                quedan persistidos.
              </p>
            </div>
          </div>


          <div className="automation-engine-latest">
            <span>Última ejecución</span>

            <strong>
              {latestExecution
                ? executionStatusLabel(
                    latestExecution.status
                  )
                : "Sin ejecuciones"}
            </strong>

            <small>
              {latestExecution
                ? formatDate(
                    latestExecution.started_at
                  )
                : "Esperando actividad"}
            </small>
          </div>
        </article>
      </section>


      <section className="panel automation-rules-panel">
        <div className="panel__header">
          <div>
            <h2>Reglas</h2>

            <span>
              Configuración activa del motor
              de automatización.
            </span>
          </div>

          <span className="automation-count">
            {rules.length} reglas
          </span>
        </div>


        {loading && rules.length === 0 ? (
          <div className="empty-state">
            Cargando reglas...
          </div>
        ) : rules.length === 0 ? (
          <div className="empty-state">
            No hay automatizaciones configuradas.
          </div>
        ) : (
          <div className="automation-rules-list">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className={
                  rule.enabled
                    ? "automation-rule"
                    : "automation-rule automation-rule--disabled"
                }
              >
                <div className="automation-rule__status">
                  <span
                    className={
                      rule.enabled
                        ? "automation-rule-dot automation-rule-dot--active"
                        : "automation-rule-dot"
                    }
                  />

                  <span>
                    {rule.enabled
                      ? "Activa"
                      : "Inactiva"}
                  </span>
                </div>


                <div className="automation-rule__main">
                  <strong>
                    {rule.name}
                  </strong>

                  <p>
                    {rule.description ||
                      "Sin descripción"}
                  </p>
                </div>


                <div className="automation-rule__meta">
                  <div>
                    <span>Trigger</span>
                    <strong>
                      {triggerLabel(
                        rule.trigger_type
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Acción</span>
                    <strong>
                      {actionLabel(
                        rule.action_type
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Ámbito</span>
                    <strong>
                      {serviceName(
                        rule.service_id
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Creada por</span>
                    <strong>
                      {rule.created_by_username}
                    </strong>
                  </div>
                </div>


                <div className="automation-rule__actions">
                  {rule.service_id === null && (
                    <select
                      className="automation-test-service-select"
                      value={
                        testServiceByRule[
                          rule.id
                        ] || ""
                      }
                      disabled={
                        busyRuleId !== null
                      }
                      onChange={(event) =>
                        setTestServiceByRule(
                          (current) => ({
                            ...current,
                            [rule.id]:
                              event.target.value,
                          })
                        )
                      }
                    >
                      <option value="">
                        Servicio de prueba
                      </option>

                      {services.map(
                        (service) => (
                          <option
                            key={service.id}
                            value={service.id}
                          >
                            {service.name}
                          </option>
                        )
                      )}
                    </select>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      busyRuleId !== null
                    }
                    onClick={() =>
                      handleTest(rule)
                    }
                  >
                    {testingRuleId === rule.id
                      ? "Probando..."
                      : "Probar"}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      busyRuleId !== null
                    }
                    onClick={() =>
                      handleToggle(rule)
                    }
                  >
                    {busyRuleId === rule.id
                      ? "Procesando..."
                      : rule.enabled
                        ? "Desactivar"
                        : "Activar"}
                  </button>

                  <button
                    type="button"
                    className="automation-delete-button"
                    disabled={
                      busyRuleId !== null
                    }
                    onClick={() =>
                      handleDelete(rule)
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>


      <section className="panel automation-history-panel">
        <div className="panel__header">
          <div>
            <h2>
              Historial de ejecuciones
            </h2>

            <span>
              Resultado auditable de cada
              automatización disparada.
            </span>
          </div>

          <div className="automation-history-filter">
            <label htmlFor="automation-status">
              Estado
            </label>

            <select
              id="automation-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="success">
                Completadas
              </option>

              <option value="failed">
                Fallidas
              </option>

              <option value="running">
                En ejecución
              </option>
            </select>
          </div>
        </div>


        {loading &&
        executions.length === 0 ? (
          <div className="empty-state">
            Cargando historial...
          </div>
        ) : visibleExecutions.length === 0 ? (
          <div className="empty-state">
            No hay ejecuciones para mostrar.
          </div>
        ) : (
          <div className="automation-history-table">
            <div className="automation-history-row automation-history-row--header">
              <span>Regla</span>
              <span>Estado</span>
              <span>Fuente</span>
              <span>Trigger</span>
              <span>Servicio</span>
              <span>Duración</span>
              <span>Fecha</span>
            </div>

            {visibleExecutions.map(
              (execution) => (
                <div
                  key={execution.id}
                  className="automation-history-row"
                >
                  <strong>
                    {execution.rule_name}
                  </strong>

                  <span
                    className={
                      "operation-status " +
                      `operation-status--${execution.status}`
                    }
                  >
                    {executionStatusLabel(
                      execution.status
                    )}
                  </span>

                  <span
                    className={
                      "automation-source " +
                      `automation-source--${
                        execution.execution_source ||
                        "trigger"
                      }`
                    }
                  >
                    {executionSourceLabel(
                      execution.execution_source ||
                      "trigger"
                    )}
                  </span>

                  <span>
                    {triggerLabel(
                      execution.trigger_type
                    )}
                  </span>

                  <span>
                    {serviceName(
                      execution.service_id
                    )}
                  </span>

                  <span>
                    {formatDuration(
                      execution.duration_ms
                    )}
                  </span>

                  <time
                    dateTime={
                      execution.started_at || ""
                    }
                  >
                    {formatDate(
                      execution.started_at
                    )}
                  </time>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}
