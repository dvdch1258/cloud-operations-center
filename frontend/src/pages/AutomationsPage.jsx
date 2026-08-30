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
  cooldownSeconds: "300",
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
    case "skipped":
      return "Omitida";
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


function cooldownLabel(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value <= 0) {
    return "Desactivado";
  }

  if (value < 60) {
    return `${value} s`;
  }

  if (value % 3600 === 0) {
    const hours = value / 3600;

    return hours === 1
      ? "1 hora"
      : `${hours} horas`;
  }

  if (value % 60 === 0) {
    const minutes = value / 60;

    return minutes === 1
      ? "1 minuto"
      : `${minutes} minutos`;
  }

  return `${value} s`;
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


  const [
    selectedExecution,
    setSelectedExecution,
  ] = useState(null);

  const [
    executionDetailLoading,
    setExecutionDetailLoading,
  ] = useState(false);

  const [
    executionDetailError,
    setExecutionDetailError,
  ] = useState("");


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


  useEffect(() => {
    if (!selectedExecution) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedExecution(null);
        setExecutionDetailError("");
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedExecution]);


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
        cooldown_seconds:
          Number(form.cooldownSeconds),
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


  async function handleOpenExecution(
    execution,
  ) {
    setSelectedExecution(execution);
    setExecutionDetailLoading(true);
    setExecutionDetailError("");

    try {
      const detail =
        await api.getAutomationExecution(
          execution.id
        );

      setSelectedExecution(detail);
    } catch (requestError) {
      setExecutionDetailError(
        requestError.message
      );
    } finally {
      setExecutionDetailLoading(false);
    }
  }


  function handleCloseExecution() {
    setSelectedExecution(null);
    setExecutionDetailError("");
    setExecutionDetailLoading(false);
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


            <label>
              <span>Cooldown</span>

              <select
                value={form.cooldownSeconds}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cooldownSeconds:
                      event.target.value,
                  }))
                }
              >
                <option value="0">
                  Desactivado
                </option>

                <option value="60">
                  1 minuto
                </option>

                <option value="300">
                  5 minutos
                </option>

                <option value="900">
                  15 minutos
                </option>

                <option value="3600">
                  1 hora
                </option>
              </select>

              <small className="automation-field-hint">
                Evita ejecuciones automáticas repetidas
                para el mismo servicio.
              </small>
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
                    <span>Cooldown</span>
                    <strong>
                      {cooldownLabel(
                        rule.cooldown_seconds
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

              <option value="skipped">
                Omitidas
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
                <button
                  key={execution.id}
                  type="button"
                  className={
                    "automation-history-row " +
                    "automation-history-row--button"
                  }
                  onClick={() =>
                    handleOpenExecution(
                      execution
                    )
                  }
                  aria-label={
                    "Ver detalle de ejecución " +
                    `#${execution.id}`
                  }
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
                </button>
              )
            )}
          </div>
        )}
      </section>


      {selectedExecution && (
        <div
          className="automation-execution-backdrop"
          onClick={handleCloseExecution}
        >
          <aside
            className="automation-execution-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="automation-execution-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="automation-execution-drawer__header">
              <div>
                <p className="eyebrow">
                  EJECUCIÓN #{selectedExecution.id}
                </p>

                <h2 id="automation-execution-title">
                  Detalle de ejecución
                </h2>

                <span>
                  {selectedExecution.rule_name}
                </span>
              </div>

              <button
                type="button"
                className="automation-execution-close"
                onClick={handleCloseExecution}
                aria-label="Cerrar detalle"
              >
                ×
              </button>
            </header>


            {executionDetailLoading && (
              <div className="automation-execution-loading">
                Actualizando detalle...
              </div>
            )}


            {executionDetailError && (
              <div className="alert alert--error">
                <strong>
                  No se pudo actualizar el detalle
                </strong>

                <span>
                  {executionDetailError}
                </span>
              </div>
            )}


            <section className="automation-execution-summary">
              <div>
                <span>Estado</span>

                <strong
                  className={
                    "operation-status " +
                    `operation-status--${
                      selectedExecution.status
                    }`
                  }
                >
                  {executionStatusLabel(
                    selectedExecution.status
                  )}
                </strong>
              </div>

              <div>
                <span>Fuente</span>

                <strong
                  className={
                    "automation-source " +
                    `automation-source--${
                      selectedExecution
                        .execution_source ||
                      "trigger"
                    }`
                  }
                >
                  {executionSourceLabel(
                    selectedExecution
                      .execution_source ||
                    "trigger"
                  )}
                </strong>
              </div>

              <div>
                <span>Regla</span>
                <strong>
                  {selectedExecution.rule_name}
                </strong>
              </div>

              <div>
                <span>Trigger</span>
                <strong>
                  {triggerLabel(
                    selectedExecution
                      .trigger_type
                  )}
                </strong>
              </div>

              <div>
                <span>Servicio</span>
                <strong>
                  {serviceName(
                    selectedExecution.service_id
                  )}
                </strong>
              </div>

              <div>
                <span>Duración</span>
                <strong>
                  {formatDuration(
                    selectedExecution.duration_ms
                  )}
                </strong>
              </div>

              <div>
                <span>Inicio</span>
                <strong>
                  {formatDate(
                    selectedExecution.started_at
                  )}
                </strong>
              </div>

              <div>
                <span>Finalización</span>
                <strong>
                  {formatDate(
                    selectedExecution.finished_at
                  )}
                </strong>
              </div>
            </section>


            {selectedExecution.status ===
              "skipped" &&
              selectedExecution.result?.reason ===
                "cooldown" && (
                <section className="automation-execution-callout">
                  <div>
                    <p className="eyebrow">
                      PROTECCIÓN ANTI-TORMENTA
                    </p>

                    <h3>
                      Omitida por cooldown
                    </h3>
                  </div>

                  <dl>
                    <div>
                      <dt>Motivo</dt>
                      <dd>Cooldown activo</dd>
                    </div>

                    <div>
                      <dt>Cooldown</dt>
                      <dd>
                        {cooldownLabel(
                          selectedExecution
                            .result
                            ?.cooldown_seconds
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Ejecución anterior
                      </dt>
                      <dd>
                        #
                        {selectedExecution
                          .result
                          ?.recent_execution_id ||
                          "—"}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}


            {selectedExecution.execution_source ===
              "manual_test" && (
                <section className="automation-execution-callout">
                  <div>
                    <p className="eyebrow">
                      PRUEBA MANUAL
                    </p>

                    <h3>
                      Ejecución iniciada por usuario
                    </h3>
                  </div>

                  <p>
                    Esta ejecución no fue provocada
                    por un cambio real de estado del
                    servicio.
                  </p>

                  <dl>
                    <div>
                      <dt>
                        Trigger configurado
                      </dt>
                      <dd>
                        {triggerLabel(
                          selectedExecution
                            .trigger_payload
                            ?.configured_trigger_type ||
                          selectedExecution
                            .trigger_type
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}


            {selectedExecution.error && (
              <section className="automation-execution-block">
                <h3>Error</h3>

                <pre className="automation-execution-error">
                  {selectedExecution.error}
                </pre>
              </section>
            )}


            {selectedExecution.result && (
              <section className="automation-execution-block">
                <h3>Resultado</h3>

                <pre>
                  {JSON.stringify(
                    selectedExecution.result,
                    null,
                    2
                  )}
                </pre>
              </section>
            )}


            {selectedExecution.trigger_payload && (
              <section className="automation-execution-block">
                <h3>
                  Payload del trigger
                </h3>

                <pre>
                  {JSON.stringify(
                    selectedExecution
                      .trigger_payload,
                    null,
                    2
                  )}
                </pre>
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
