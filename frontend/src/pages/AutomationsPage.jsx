import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { api } from "../api/client";


const initialForm = {
  name: "",
  description: "",
  serviceId: "",
  triggerType: "service_down",
  cooldownSeconds: "300",
};


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
  );
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


function executionStatusLabel(status, t) {
  switch (status) {
    case "success":
      return t("automations.executionStatus.success");
    case "failed":
      return t("automations.executionStatus.failed");
    case "running":
      return t("automations.executionStatus.running");
    case "skipped":
      return t("automations.executionStatus.skipped");
    default:
      return status || t("automations.common.unknown");
  }
}


function triggerLabel(trigger, t) {
  if (trigger === "service_down") {
    return t("automations.trigger.service_down");
  }

  if (trigger === "service_recovered") {
    return t("automations.trigger.service_recovered");
  }

  return trigger || "—";
}


function actionLabel(action, t) {
  if (action === "notify_webhook") {
    return t("automations.action.notify_webhook");
  }

  return action || "—";
}


function executionSourceLabel(source, t) {
  if (source === "manual_test") {
    return t("automations.executionSource.manual_test");
  }

  if (source === "trigger") {
    return t("automations.executionSource.trigger");
  }

  return source || "—";
}


function cooldownLabel(seconds, t) {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value <= 0) {
    return t("automations.cooldown.disabled");
  }

  if (value < 60) {
    return `${value} s`;
  }

  if (value % 3600 === 0) {
    return t("automations.cooldown.hour", {
      count: value / 3600,
    });
  }

  if (value % 60 === 0) {
    return t("automations.cooldown.minute", {
      count: value / 60,
    });
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
  const { t, i18n } = useTranslation();
  const language =
    i18n.resolvedLanguage || i18n.language;

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
        setError(
          requestError.message ||
            t("automations.errors.load")
        );
      } finally {
        setLoading(false);
      }
    }, [t]);


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
      return t("automations.service.all");
    }

    const service = services.find(
      (item) => item.id === serviceId
    );

    return service
      ? service.name
      : t("automations.service.fallback", {
          id: serviceId,
        });
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
        t("automations.messages.created")
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          t("automations.errors.action")
      );
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
          ? t("automations.messages.disabled")
          : t("automations.messages.enabled")
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          t("automations.errors.action")
      );
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
          t(
            "automations.messages.testServiceRequired"
          )
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
          t("automations.messages.testSuccess", {
            name: rule.name,
          })
        );
      } else {
        setError(
          execution.error ||
            t("automations.messages.testFailed", {
              name: rule.name,
            })
        );
      }

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          t("automations.errors.action")
      );
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
        requestError.message ||
          t("automations.errors.detail")
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
        t("automations.messages.deleteConfirm", {
          name: rule.name,
        })
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
        t("automations.messages.deleted")
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
          t("automations.errors.action")
      );
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
            {t("automations.page.eyebrow")}
          </p>

          <h1>{t("automations.page.title")}</h1>

          <p className="subtitle">
            {t("automations.page.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadData}
          disabled={loading || saving}
        >
          {loading
            ? t("automations.page.refreshing")
            : t("automations.page.refresh")}
        </button>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            {t("automations.errors.action")}
          </strong>

          <span>{error}</span>
        </section>
      )}


      {successMessage && (
        <section className="alert alert--success">
          <strong>
            {t("automations.page.successHeading")}
          </strong>

          <span>{successMessage}</span>
        </section>
      )}


      <section className="automation-summary-grid">
        <SummaryCard
          label={t("automations.summary.rules")}
          value={rules.length}
          description={t(
            "automations.summary.rulesDescription"
          )}
        />

        <SummaryCard
          label={t("automations.summary.active")}
          value={activeRules}
          description={t(
            "automations.summary.activeDescription"
          )}
        />

        <SummaryCard
          label={t("automations.summary.executions")}
          value={executions.length}
          description={t(
            "automations.summary.executionsDescription"
          )}
        />

        <SummaryCard
          label={t("automations.summary.failed")}
          value={failedExecutions}
          description={t(
            "automations.summary.failedDescription"
          )}
        />
      </section>


      <section className="automation-main-grid">
        <article className="panel automation-create-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">
                {t("automations.form.eyebrow")}
              </p>

              <h2>
                {t("automations.form.title")}
              </h2>

              <span>
                {t("automations.form.description")}
              </span>
            </div>
          </div>


          <form
            className="automation-form"
            onSubmit={handleCreate}
          >
            <label>
              <span>{t("automations.form.name")}</span>

              <input
                type="text"
                value={form.name}
                placeholder={t(
                  "automations.form.namePlaceholder"
                )}
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
              <span>
                {t("automations.form.descriptionLabel")}
              </span>

              <textarea
                value={form.description}
                placeholder={t(
                  "automations.form.descriptionPlaceholder"
                )}
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
              <span>{t("automations.form.service")}</span>

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
                  {t("automations.service.all")}
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
              <span>{t("automations.form.cooldown")}</span>

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
                  {t(
                    "automations.form.cooldownOptions.disabled"
                  )}
                </option>

                <option value="60">
                  {t(
                    "automations.form.cooldownOptions.oneMinute"
                  )}
                </option>

                <option value="300">
                  {t(
                    "automations.form.cooldownOptions.fiveMinutes"
                  )}
                </option>

                <option value="900">
                  {t(
                    "automations.form.cooldownOptions.fifteenMinutes"
                  )}
                </option>

                <option value="3600">
                  {t(
                    "automations.form.cooldownOptions.oneHour"
                  )}
                </option>
              </select>

              <small className="automation-field-hint">
                {t("automations.form.cooldownHint")}
              </small>
            </label>


            <div className="automation-fixed-grid">
              <div>
                <span>{t("automations.form.trigger")}</span>

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
                    {t("automations.trigger.service_down")}
                  </option>

                  <option value="service_recovered">
                    {t(
                      "automations.trigger.service_recovered"
                    )}
                  </option>
                </select>
              </div>

              <div>
                <span>{t("automations.form.action")}</span>
                <strong>
                  {t("automations.action.notify_webhook")}
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
                ? t("automations.form.creating")
                : t("automations.form.create")}
            </button>
          </form>
        </article>


        <article className="panel automation-engine-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">
                {t("automations.engine.eyebrow")}
              </p>

              <h2>{t("automations.engine.title")}</h2>

              <span>
                {t("automations.engine.description")}
              </span>
            </div>
          </div>


          <div className="automation-engine-flow">
            <div>
              <span>1</span>
              <strong>
                {t("automations.engine.detect")}
              </strong>
              <p>
                {t("automations.engine.detectDescription")}
              </p>
            </div>

            <div>
              <span>2</span>
              <strong>
                {t("automations.engine.evaluate")}
              </strong>
              <p>
                {t(
                  "automations.engine.evaluateDescription"
                )}
              </p>
            </div>

            <div>
              <span>3</span>
              <strong>
                {t("automations.engine.act")}
              </strong>
              <p>
                {t("automations.engine.actDescription")}
              </p>
            </div>

            <div>
              <span>4</span>
              <strong>
                {t("automations.engine.audit")}
              </strong>
              <p>
                {t("automations.engine.auditDescription")}
              </p>
            </div>
          </div>


          <div className="automation-engine-latest">
            <span>
              {t("automations.engine.latestExecution")}
            </span>

            <strong>
              {latestExecution
                ? executionStatusLabel(
                    latestExecution.status,
                    t,
                  )
                : t("automations.engine.noExecutions")}
            </strong>

            <small>
              {latestExecution
                ? formatDate(
                    latestExecution.started_at,
                    language,
                  )
                : t(
                    "automations.engine.waitingActivity"
                  )}
            </small>
          </div>
        </article>
      </section>


      <section className="panel automation-rules-panel">
        <div className="panel__header">
          <div>
            <h2>{t("automations.rules.title")}</h2>

            <span>
              {t("automations.rules.description")}
            </span>
          </div>

          <span className="automation-count">
            {t("automations.rules.count", {
              count: rules.length,
            })}
          </span>
        </div>


        {loading && rules.length === 0 ? (
          <div className="empty-state">
            {t("automations.rules.loading")}
          </div>
        ) : rules.length === 0 ? (
          <div className="empty-state">
            {t("automations.rules.empty")}
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
                      ? t("automations.rules.active")
                      : t("automations.rules.inactive")}
                  </span>
                </div>


                <div className="automation-rule__main">
                  <strong>
                    {rule.name}
                  </strong>

                  <p>
                    {rule.description ||
                      t("automations.rules.noDescription")}
                  </p>
                </div>


                <div className="automation-rule__meta">
                  <div>
                    <span>
                      {t("automations.rules.trigger")}
                    </span>
                    <strong>
                      {triggerLabel(
                        rule.trigger_type,
                        t,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("automations.rules.action")}
                    </span>
                    <strong>
                      {actionLabel(
                        rule.action_type,
                        t,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("automations.rules.scope")}
                    </span>
                    <strong>
                      {serviceName(
                        rule.service_id
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("automations.rules.cooldown")}
                    </span>
                    <strong>
                      {cooldownLabel(
                        rule.cooldown_seconds,
                        t,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("automations.rules.createdBy")}
                    </span>
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
                        {t("automations.rules.testService")}
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
                      ? t("automations.rules.testing")
                      : t("automations.rules.test")}
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
                      ? t("automations.rules.processing")
                      : rule.enabled
                        ? t("automations.rules.deactivate")
                        : t("automations.rules.activate")}
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
                    {t("automations.rules.delete")}
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
              {t("automations.history.title")}
            </h2>

            <span>
              {t("automations.history.description")}
            </span>
          </div>

          <div className="automation-history-filter">
            <label htmlFor="automation-status">
              {t("automations.history.filterStatus")}
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
                {t("automations.history.filterAll")}
              </option>

              <option value="success">
                {t("automations.executionStatus.success")}
              </option>

              <option value="failed">
                {t("automations.executionStatus.failed")}
              </option>

              <option value="running">
                {t("automations.executionStatus.running")}
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
            {t("automations.history.loading")}
          </div>
        ) : visibleExecutions.length === 0 ? (
          <div className="empty-state">
            {t("automations.history.empty")}
          </div>
        ) : (
          <div className="automation-history-table">
            <div className="automation-history-row automation-history-row--header">
              <span>{t("automations.history.columns.rule")}</span>
              <span>{t("automations.history.columns.status")}</span>
              <span>{t("automations.history.columns.source")}</span>
              <span>{t("automations.history.columns.trigger")}</span>
              <span>{t("automations.history.columns.service")}</span>
              <span>{t("automations.history.columns.duration")}</span>
              <span>{t("automations.history.columns.started")}</span>
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
                      execution.status,
                      t,
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
                      "trigger",
                      t,
                    )}
                  </span>

                  <span>
                    {triggerLabel(
                      execution.trigger_type,
                      t,
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
                      execution.started_at,
                      language,
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
                  {t("automations.detail.eyebrow")}
                </p>

                <h2 id="automation-execution-title">
                  {t("automations.detail.title", {
                    id: selectedExecution.id,
                  })}
                </h2>

                <span>
                  {selectedExecution.rule_name}
                </span>
              </div>

              <button
                type="button"
                className="automation-execution-close"
                onClick={handleCloseExecution}
                aria-label={t("automations.detail.closeAria")}
              >
                ×
              </button>
            </header>


            {executionDetailLoading && (
              <div className="automation-execution-loading">
                {t("automations.detail.loading")}
              </div>
            )}


            {executionDetailError && (
              <div className="alert alert--error">
                <strong>
                  {t("automations.detail.errorHeading")}
                </strong>

                <span>
                  {executionDetailError}
                </span>
              </div>
            )}


            <section className="automation-execution-summary">
              <div>
                <span>{t("automations.detail.status")}</span>

                <strong
                  className={
                    "operation-status " +
                    `operation-status--${
                      selectedExecution.status
                    }`
                  }
                >
                  {executionStatusLabel(
                    selectedExecution.status,
                    t,
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.source")}</span>

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
                    "trigger",
                    t,
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.rule")}</span>
                <strong>
                  {selectedExecution.rule_name}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.trigger")}</span>
                <strong>
                  {triggerLabel(
                    selectedExecution
                      .trigger_type,
                    t,
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.service")}</span>
                <strong>
                  {serviceName(
                    selectedExecution.service_id
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.duration")}</span>
                <strong>
                  {formatDuration(
                    selectedExecution.duration_ms
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.started")}</span>
                <strong>
                  {formatDate(
                    selectedExecution.started_at,
                    language,
                  )}
                </strong>
              </div>

              <div>
                <span>{t("automations.detail.finished")}</span>
                <strong>
                  {formatDate(
                    selectedExecution.finished_at,
                    language,
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
                      {t(
                        "automations.detail.cooldownProtection.eyebrow"
                      )}
                    </p>

                    <h3>
                      {t(
                        "automations.detail.cooldownProtection.title"
                      )}
                    </h3>
                  </div>

                  <dl>
                    <div>
                      <dt>
                        {t(
                          "automations.detail.cooldownProtection.reason"
                        )}
                      </dt>
                      <dd>
                        {t(
                          "automations.detail.cooldownProtection.active"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        {t("automations.detail.cooldown")}
                      </dt>
                      <dd>
                        {cooldownLabel(
                          selectedExecution
                            .result
                            ?.cooldown_seconds,
                          t,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        {t(
                          "automations.detail.cooldownProtection.previousExecution"
                        )}
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
                      {t(
                        "automations.detail.manualTest.eyebrow"
                      )}
                    </p>

                    <h3>
                      {t(
                        "automations.detail.manualTest.title"
                      )}
                    </h3>
                  </div>

                  <p>
                    {t(
                      "automations.detail.manualTest.description"
                    )}
                  </p>

                  <dl>
                    <div>
                      <dt>
                        {t(
                          "automations.detail.configuredTrigger"
                        )}
                      </dt>
                      <dd>
                        {triggerLabel(
                          selectedExecution
                            .trigger_payload
                            ?.configured_trigger_type ||
                          selectedExecution
                            .trigger_type,
                          t,
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}


            {selectedExecution.error && (
              <section className="automation-execution-block">
                <h3>
                  {t("automations.detail.executionError")}
                </h3>

                <pre className="automation-execution-error">
                  {selectedExecution.error}
                </pre>
              </section>
            )}


            {selectedExecution.result && (
              <section className="automation-execution-block">
                <h3>
                  {t("automations.detail.result")}
                </h3>

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
                  {t("automations.detail.triggerPayload")}
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
