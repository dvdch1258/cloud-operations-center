import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";


function operationLabel(operation, t) {
  if (operation === "service_health_check") {
    return t("operations.operation.serviceHealthCheck");
  }

  return operation || t("operations.operation.generic");
}


function statusLabel(status, t) {
  switch (status) {
    case "success":
      return t("operations.status.success");
    case "failed":
      return t("operations.status.failed");
    case "running":
      return t("operations.status.running");
    default:
      return status || t("operations.status.unknown");
  }
}


function serviceStatusLabel(status, t) {
  switch (status) {
    case "up":
      return t("operations.serviceStatus.up");
    case "down":
      return t("operations.serviceStatus.down");
    case "unknown":
      return t("operations.serviceStatus.unknown");
    default:
      return status || t("operations.serviceStatus.unknown");
  }
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



/* OPERATIONS_V2_DATA_FOUNDATION */

function buildOperationViewModel(execution) {
  const rawResult =
    execution?.result &&
    typeof execution.result === "object" &&
    !Array.isArray(execution.result)
      ? execution.result
      : {};

  const services = Array.isArray(
    rawResult.results,
  )
    ? rawResult.results
    : [];

  const healthyServices =
    services.filter(
      (service) =>
        service.status === "up",
    );

  const unavailableServices =
    services.filter(
      (service) =>
        service.status === "down",
    );

  const changedServices =
    services.filter(
      (service) =>
        service.previous_status &&
        service.status &&
        service.previous_status !==
          service.status,
    );

  const recoveredServices =
    changedServices.filter(
      (service) =>
        service.previous_status ===
          "down" &&
        service.status === "up",
    );

  const degradedServices =
    changedServices.filter(
      (service) =>
        service.previous_status ===
          "up" &&
        service.status === "down",
    );

  const numberValue = (
    value,
    fallback = 0,
  ) => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  };

  const servicesChecked =
    numberValue(
      rawResult.services_checked,
      services.length,
    );

  const servicesUp =
    numberValue(
      rawResult.services_up,
      healthyServices.length,
    );

  const servicesDown =
    numberValue(
      rawResult.services_down,
      unavailableServices.length,
    );

  const incidentsCreated =
    numberValue(
      rawResult.incidents_created,
    );

  const incidentsResolved =
    numberValue(
      rawResult.incidents_resolved,
    );

  const automationTriggerEvents =
    numberValue(
      rawResult.automation_trigger_events,
    );

  const automationExecutions =
    numberValue(
      rawResult.automation_executions,
    );

  const automationFailures =
    numberValue(
      rawResult.automation_failures,
    );

  const automationErrors =
    numberValue(
      rawResult.automation_errors,
    );

  return {
    execution,
    result: rawResult,
    services,

    servicesChecked,
    servicesUp,
    servicesDown,

    healthyServices,
    unavailableServices,

    changedServices,
    recoveredServices,
    degradedServices,

    incidentsCreated,
    incidentsResolved,

    automationTriggerEvents,
    automationExecutions,
    automationFailures,
    automationErrors,

    hasOperationalIssues:
      execution?.status === "failed" ||
      servicesDown > 0 ||
      automationFailures > 0 ||
      automationErrors > 0,
  };
}


function SummaryCard({
  label,
  value,
  description,
}) {
  return (
    <article className="operations-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}


export default function OperationsPage() {
  const { t, i18n } = useTranslation();

  const language =
    i18n.resolvedLanguage ||
    i18n.language;

  const [executions, setExecutions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [executing, setExecuting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const [historyStatus, setHistoryStatus] =
    useState("all");

  const [historySearch, setHistorySearch] =
    useState("");

  const [
    historyIssuesOnly,
    setHistoryIssuesOnly,
  ] = useState(false);

  const [
    expandedExecutions,
    setExpandedExecutions,
  ] = useState([]);


  function toggleExecution(id) {
    setExpandedExecutions(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id,
            )
          : [...current, id],
    );
  }


  const loadExecutions =
    useCallback(async () => {
      setError("");

      try {
        const data =
          await api.getOperationExecutions(50);

        setExecutions(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);


  async function handleServiceCheck() {
    if (executing) {
      return;
    }

    setExecuting(true);
    setError("");
    setSuccessMessage("");

    try {
      const execution =
        await api.runServiceHealthCheck();

      const result = execution.result || {};

      setSuccessMessage(
        t("operations.successMessage", {
          up: result.services_up || 0,
          down: result.services_down || 0,
        }),
      );

      await loadExecutions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setExecuting(false);
    }
  }


  const latestExecution =
    executions[0] || null;

  const latestOperation =
    buildOperationViewModel(
      latestExecution,
    );

  const successfulExecutions =
    useMemo(
      () =>
        executions.filter(
          (execution) =>
            execution.status === "success"
        ).length,
      [executions],
    );


  const failedExecutions =
    useMemo(
      () =>
        executions.filter(
          (execution) =>
            execution.status === "failed",
        ).length,
      [executions],
    );


  const completedExecutions =
    successfulExecutions +
    failedExecutions;


  const successRate =
    completedExecutions > 0
      ? Math.round(
          (
            successfulExecutions /
            completedExecutions
          ) * 100,
        )
      : null;


  const latestStatusTone =
    !latestExecution
      ? "neutral"
      : latestOperation.hasOperationalIssues
        ? "warning"
        : "up";


  const latestStatusTitle =
    !latestExecution
      ? t("operations.overview.waitingTitle")
      : latestOperation.hasOperationalIssues
        ? t("operations.overview.attentionTitle")
        : t("operations.overview.stableTitle");


  const latestStatusDescription =
    !latestExecution
      ? t("operations.overview.waitingDescription")
      : latestOperation.hasOperationalIssues
        ? t("operations.overview.issuesDescription", {
            down: latestOperation.servicesDown,
            issues:
              latestOperation.automationFailures +
              latestOperation.automationErrors,
          })
        : t("operations.overview.stableDescription", {
            up: latestOperation.servicesUp,
            checked: latestOperation.servicesChecked,
          });


  const filteredExecutions =
    useMemo(() => {
      const search =
        historySearch
          .trim()
          .toLowerCase();

      return executions.filter(
        (execution) => {
          if (
            historyStatus !== "all" &&
            execution.status !== historyStatus
          ) {
            return false;
          }

          const operationView =
            buildOperationViewModel(
              execution,
            );

          if (
            historyIssuesOnly &&
            !operationView.hasOperationalIssues
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          const serviceSearch =
            operationView.services
              .flatMap(
                (service) => [
                  service.name,
                  service.endpoint,
                  service.service_id != null
                    ? String(
                        service.service_id,
                      )
                    : "",
                ],
              );

          const haystack = [
            operationLabel(execution.operation, t),
            execution
              .requested_by_username,
            execution.error,
            ...serviceSearch,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            search,
          );
        },
      );
    }, [
      executions,
      historyStatus,
      historySearch,
      historyIssuesOnly,
      t,
    ]);


  const historyIssueCount =
    useMemo(
      () =>
        executions.filter(
          (execution) =>
            buildOperationViewModel(
              execution,
            ).hasOperationalIssues,
        ).length,
      [executions],
    );


  return (
    <>
      {/* OPERATIONS_V2_OVERVIEW */}
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {t("operations.eyebrow")}
          </p>

          <h1>
            {t("operations.title")}
          </h1>

          <p className="subtitle">
            {t("operations.subtitle")}
          </p>
        </div>

        <div className="operations-v2__header-actions">
          <div className="operations-v2__last-run">
            <span>
              {t("operations.lastRun")}
            </span>

            <strong>
              {latestExecution
                ? formatDate(latestExecution.started_at, language)
                : "—"}
            </strong>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadExecutions}
            disabled={
              loading ||
              executing
            }
          >
            {loading
              ? t("common.refreshing")
              : t("common.refresh")}
          </button>
        </div>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            {t("operations.refreshError")}
          </strong>

          <span>{error}</span>

          <div className="v2-error-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={loading || executing}
              onClick={loadExecutions}
            >
              {t("operations.retry")}
            </button>
          </div>
        </section>
      )}


      {successMessage && (
        <section className="alert alert--success">
          <strong>
            {t("operations.successTitle")}
          </strong>

          <span>{successMessage}</span>
        </section>
      )}


      <section className="operations-summary-grid">
        <SummaryCard
          label={t("operations.kpi.executions")}
          value={executions.length}
          description={
            t("operations.kpi.completed", {
              count: completedExecutions,
            })
          }
        />

        <SummaryCard
          label={t("operations.kpi.reliability")}
          value={
            successRate != null
              ? `${successRate}%`
              : "—"
          }
          description={
            failedExecutions > 0
              ? t("operations.kpi.failed", {
                  count: failedExecutions,
                })
              : t("operations.kpi.noFailures")
          }
        />

        <SummaryCard
          label={t("operations.kpi.services")}
          value={
            latestExecution
              ? latestOperation.servicesChecked
              : "—"
          }
          description={
            latestExecution
              ? t("operations.kpi.serviceState", {
                  up: latestOperation.servicesUp,
                  down: latestOperation.servicesDown,
                })
              : t("operations.kpi.waitingExecution")
          }
        />

        <SummaryCard
          label={t("operations.kpi.automations")}
          value={
            latestExecution
              ? latestOperation.automationExecutions
              : "—"
          }
          description={
            latestExecution
              ? t("operations.kpi.issues", {
                  count:
                    latestOperation.automationFailures +
                    latestOperation.automationErrors,
                })
              : t("operations.kpi.latestExecution")
          }
        />
      </section>


      <section className="platform-status operations-v2-status">
        <div>
          <span
            className={
              latestStatusTone === "up"
                ? "status-dot status-dot--up"
                : latestStatusTone === "warning"
                  ? "status-dot status-dot--warning"
                  : "status-dot"
            }
          />

          <div>
            <strong>
              {latestStatusTitle}
            </strong>

            <p>
              {latestStatusDescription}
            </p>
          </div>
        </div>

        <div className="operations-v2-status__meta">
          <span className="environment-badge">
            {latestExecution
              ? t("operations.overview.execution", {
                  id: latestExecution.id,
                })
              : t("operations.overview.noExecution")}
          </span>

          {latestExecution && (
            <span>
              {formatDuration(
                latestExecution.duration_ms,
              )}
            </span>
          )}
        </div>
      </section>


      <section className="operations-action-grid">
        <article className="panel operations-action-card">
          <div className="operations-action-card__heading">
            <div>
              <p className="eyebrow">
                {t("operations.action.eyebrow")}
              </p>

              <h2>
                {t("operations.action.title")}
              </h2>

              <p>
                {t("operations.action.description")}
              </p>
            </div>

            <span className="operations-action-icon">
              ✓
            </span>
          </div>


          <div className="operations-action-details">
            <div>
              <span>{t("operations.action.type")}</span>
              <strong>
                {t("operations.action.typeValue")}
              </strong>
            </div>

            <div>
              <span>{t("operations.action.audit")}</span>
              <strong>
                {t("operations.action.auditValue")}
              </strong>
            </div>

            <div>
              <span>{t("operations.action.impact")}</span>
              <strong>
                {t("operations.action.impactValue")}
              </strong>
            </div>
          </div>


          <button
            type="button"
            className="primary-button operations-run-button"
            onClick={handleServiceCheck}
            disabled={executing}
          >
            {executing
              ? t("operations.action.running")
              : t("operations.action.run")}
          </button>
        </article>


        {/* OPERATIONS_V2_LATEST_EXECUTION */}
        <article className="panel operations-latest-card operations-v2-latest">
          <div className="panel__header operations-v2-latest__header">
            <div>
              <p className="eyebrow">
                {t("operations.latest.eyebrow")}
              </p>

              <h2>
                {t("operations.latest.title")}
              </h2>

              <span>
                {t("operations.latest.subtitle")}
              </span>
            </div>

            {latestExecution && (
              <span
                className={
                  "operation-status " +
                  `operation-status--${latestExecution.status}`
                }
              >
                {statusLabel(latestExecution.status, t)}
              </span>
            )}
          </div>

          {!latestExecution ? (
            <div className="empty-state">
              {t("operations.latest.empty")}
            </div>
          ) : (
            <>
              <div className="operations-v2-latest__meta">
                <div>
                  <span>
                    {t("operations.latest.execution")}
                  </span>

                  <strong>
                    #{latestExecution.id}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.user")}
                  </span>

                  <strong>
                    {
                      latestExecution
                        .requested_by_username
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.duration")}
                  </span>

                  <strong>
                    {formatDuration(
                      latestExecution.duration_ms,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.date")}
                  </span>

                  <strong>
                    {formatDate(latestExecution.started_at, language)}
                  </strong>
                </div>
              </div>


              <div className="operations-v2-latest__summary">
                <div>
                  <span>
                    {t("operations.latest.servicesChecked")}
                  </span>

                  <strong>
                    {
                      latestOperation
                        .servicesChecked
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.operational")}
                  </span>

                  <strong className="operations-v2-value--success">
                    {
                      latestOperation
                        .servicesUp
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.unavailable")}
                  </span>

                  <strong
                    className={
                      latestOperation.servicesDown > 0
                        ? "operations-v2-value--danger"
                        : ""
                    }
                  >
                    {
                      latestOperation
                        .servicesDown
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    {t("operations.latest.changesDetected")}
                  </span>

                  <strong>
                    {
                      latestOperation
                        .changedServices
                        .length
                    }
                  </strong>
                </div>
              </div>


              <div className="operations-v2-latest__grid">
                <section className="operations-v2-latest__section">
                  <div className="operations-v2-latest__section-header">
                    <div>
                      <span className="operations-v2-section-icon">
                        ↕
                      </span>

                      <div>
                        <strong>
                          {t("operations.latest.statusChanges")}
                        </strong>

                        <small>
                          {t("operations.latest.statusChangesHint")}
                        </small>
                      </div>
                    </div>

                    <span className="operations-v2-count">
                      {
                        latestOperation
                          .changedServices
                          .length
                      }
                    </span>
                  </div>

                  {latestOperation.changedServices.length === 0 ? (
                    <div className="operations-v2-empty">
                      {t("operations.latest.noStatusChanges")}
                    </div>
                  ) : (
                    <div className="operations-v2-service-changes">
                      {latestOperation.changedServices
                        .slice(0, 6)
                        .map((service) => (
                          <Link
                            key={service.service_id}
                            to={`/servicios/${service.service_id}`}
                            className="operations-v2-service-change"
                          >
                            <div>
                              <strong>
                                {service.name}
                              </strong>

                              <span>
                                {service.endpoint}
                              </span>
                            </div>

                            <div className="operations-v2-service-change__status">
                              <span
                                className={
                                  "operation-status " +
                                  `operation-status--${
                                    service.previous_status === "up"
                                      ? "success"
                                      : "failed"
                                  }`
                                }
                              >
                                {service.previous_status
                                  ? serviceStatusLabel(
                                      service.previous_status,
                                      t,
                                    )
                                  : "—"}
                              </span>

                              <span>
                                →
                              </span>

                              <span
                                className={
                                  "operation-status " +
                                  `operation-status--${
                                    service.status === "up"
                                      ? "success"
                                      : "failed"
                                  }`
                                }
                              >
                                {serviceStatusLabel(
                                  service.status,
                                  t,
                                )}
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}

                  {latestOperation.changedServices.length > 6 && (
                    <div className="operations-v2-more">
                      {t("operations.latest.additionalChanges", {
                        count:
                          latestOperation
                            .changedServices
                            .length - 6,
                      })}
                    </div>
                  )}
                </section>


                <section className="operations-v2-latest__section">
                  <div className="operations-v2-latest__section-header">
                    <div>
                      <span className="operations-v2-section-icon">
                        !
                      </span>

                      <div>
                        <strong>
                          {t("operations.latest.incidents")}
                        </strong>

                        <small>
                          {t("operations.latest.incidentsHint")}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="operations-v2-impact-grid">
                    <div>
                      <span>
                        {t("operations.latest.created")}
                      </span>

                      <strong
                        className={
                          latestOperation.incidentsCreated > 0
                            ? "operations-v2-value--danger"
                            : ""
                        }
                      >
                        {
                          latestOperation
                            .incidentsCreated
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.resolved")}
                      </span>

                      <strong
                        className={
                          latestOperation.incidentsResolved > 0
                            ? "operations-v2-value--success"
                            : ""
                        }
                      >
                        {
                          latestOperation
                            .incidentsResolved
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.degraded")}
                      </span>

                      <strong>
                        {
                          latestOperation
                            .degradedServices
                            .length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.recovered")}
                      </span>

                      <strong>
                        {
                          latestOperation
                            .recoveredServices
                            .length
                        }
                      </strong>
                    </div>
                  </div>
                </section>


                <section className="operations-v2-latest__section">
                  <div className="operations-v2-latest__section-header">
                    <div>
                      <span className="operations-v2-section-icon">
                        ⚡
                      </span>

                      <div>
                        <strong>
                          {t("operations.latest.automations")}
                        </strong>

                        <small>
                          {t("operations.latest.automationsHint")}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="operations-v2-impact-grid">
                    <div>
                      <span>
                        {t("operations.latest.events")}
                      </span>

                      <strong>
                        {
                          latestOperation
                            .automationTriggerEvents
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.executions")}
                      </span>

                      <strong>
                        {
                          latestOperation
                            .automationExecutions
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.failed")}
                      </span>

                      <strong
                        className={
                          latestOperation.automationFailures > 0
                            ? "operations-v2-value--danger"
                            : ""
                        }
                      >
                        {
                          latestOperation
                            .automationFailures
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("operations.latest.errors")}
                      </span>

                      <strong
                        className={
                          latestOperation.automationErrors > 0
                            ? "operations-v2-value--danger"
                            : ""
                        }
                      >
                        {
                          latestOperation
                            .automationErrors
                        }
                      </strong>
                    </div>
                  </div>
                </section>
              </div>


              {latestExecution.error && (
                <div className="operations-v2-execution-error">
                  <strong>
                    {t("operations.latest.executionError")}
                  </strong>

                  <span>
                    {latestExecution.error}
                  </span>
                </div>
              )}
            </>
          )}
        </article>
      </section>


      {/* OPERATIONS_V2_HISTORY */}
      <section className="panel operations-history operations-v2-history">
        <div className="panel__header operations-v2-history__header">
          <div>
            <p className="eyebrow">
              {t("operations.history.eyebrow")}
            </p>

            <h2>
              {t("operations.history.title")}
            </h2>

            <span>
              {t("operations.history.subtitle")}
            </span>
          </div>

          <span className="operations-history-count">
            {filteredExecutions.length}
            {" / "}
            {executions.length}
          </span>
        </div>


        <div className="operations-v2-history__filters">
          <label className="operations-v2-history__search">
            <span>
              {t("operations.history.search")}
            </span>

            <input
              type="search"
              value={historySearch}
              placeholder={t("operations.history.searchPlaceholder")}
              onChange={(event) =>
                setHistorySearch(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              {t("operations.history.status")}
            </span>

            <select
              value={historyStatus}
              onChange={(event) =>
                setHistoryStatus(
                  event.target.value,
                )
              }
            >
              <option value="all">
                {t("operations.history.all")}
              </option>

              <option value="success">
                {t("operations.history.completed")}
              </option>

              <option value="failed">
                {t("operations.history.failed")}
              </option>

              <option value="running">
                {t("operations.history.running")}
              </option>
            </select>
          </label>

          <label className="operations-v2-history__issues">
            <input
              type="checkbox"
              checked={historyIssuesOnly}
              onChange={(event) =>
                setHistoryIssuesOnly(
                  event.target.checked,
                )
              }
            />

            <span>
              {t("operations.history.issuesOnly")}
              {historyIssueCount > 0
                ? ` · ${historyIssueCount}`
                : ""}
            </span>
          </label>
        </div>


        {loading && executions.length === 0 ? (
          <div className="empty-state">
            {t("operations.history.loading")}
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="empty-state">
            {executions.length === 0
              ? t("operations.history.none")
              : t("operations.history.noMatches")}
          </div>
        ) : (
          <div className="operations-v2-history__list">
            {filteredExecutions.map(
              (execution) => {
                const operationView =
                  buildOperationViewModel(
                    execution,
                  );

                const expanded =
                  expandedExecutions.includes(
                    execution.id,
                  );

                return (
                  <article
                    key={execution.id}
                    className={
                      "operations-v2-history-item" +
                      (
                        expanded
                          ? " operations-v2-history-item--expanded"
                          : ""
                      )
                    }
                  >
                    <button
                      type="button"
                      className="operations-v2-history-row"
                      aria-expanded={expanded}
                      onClick={() =>
                        toggleExecution(
                          execution.id,
                        )
                      }
                    >
                      <div className="operations-v2-history-row__operation">
                        <span className="operations-v2-history-row__id">
                          #{execution.id}
                        </span>

                        <div>
                          <strong>
                            {operationLabel(execution.operation, t)}
                          </strong>

                          <small>
                            {execution
                              .requested_by_username}
                          </small>
                        </div>
                      </div>

                      <span
                        className={
                          "operation-status " +
                          `operation-status--${execution.status}`
                        }
                      >
                        {statusLabel(execution.status, t)}
                      </span>

                      <div className="operations-v2-history-row__result">
                        {execution.status ===
                        "success" ? (
                          <>
                            <strong>
                              {
                                operationView
                                  .servicesUp
                              }
                              /
                              {
                                operationView
                                  .servicesChecked
                              }
                            </strong>

                            <span>
                              {t("operations.history.operational")}
                            </span>
                          </>
                        ) : (
                          <>
                            <strong>
                              {
                                operationView
                                  .servicesDown
                              }
                            </strong>

                            <span>
                              {t("operations.history.unavailable")}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="operations-v2-history-row__duration">
                        <strong>
                          {formatDuration(
                            execution.duration_ms,
                          )}
                        </strong>

                        <span>
                          {t("operations.history.duration")}
                        </span>
                      </div>

                      <time
                        dateTime={
                          execution.started_at ||
                          ""
                        }
                      >
                        {formatDate(execution.started_at, language)}
                      </time>

                      <span
                        className={
                          "operations-v2-history-row__chevron" +
                          (
                            expanded
                              ? " operations-v2-history-row__chevron--open"
                              : ""
                          )
                        }
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>


                    {expanded && (
                      <div className="operations-v2-history-detail">
                        <div className="operations-v2-history-detail__summary">
                          <div>
                            <span>
                              {t("operations.history.services")}
                            </span>

                            <strong>
                              {
                                operationView
                                  .servicesChecked
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              {t("operations.history.changes")}
                            </span>

                            <strong>
                              {
                                operationView
                                  .changedServices
                                  .length
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              {t("operations.history.incidents")}
                            </span>

                            <strong>
                              {
                                operationView
                                  .incidentsCreated
                              }
                              {" / "}
                              {
                                operationView
                                  .incidentsResolved
                              }
                            </strong>

                            <small>
                              {t("operations.history.createdResolved")}
                            </small>
                          </div>

                          <div>
                            <span>
                              {t("operations.history.automations")}
                            </span>

                            <strong>
                              {
                                operationView
                                  .automationExecutions
                              }
                            </strong>

                            <small>
                              {t("operations.history.problems", {
                                count:
                                  operationView.automationFailures +
                                  operationView.automationErrors,
                              })}
                            </small>
                          </div>
                        </div>


                        {execution.error && (
                          <div className="operations-v2-execution-error">
                            <strong>
                              {t("operations.history.executionError")}
                            </strong>

                            <span>
                              {execution.error}
                            </span>
                          </div>
                        )}


                        <div className="operations-v2-history-services">
                          <div className="operations-v2-history-services__header">
                            <div>
                              <strong>
                                {t("operations.history.servicesChecked")}
                              </strong>

                              <span>
                                {t("operations.history.servicesCheckedHint")}
                              </span>
                            </div>

                            <span>
                              {
                                operationView
                                  .services
                                  .length
                              }
                            </span>
                          </div>


                          {operationView.services.length === 0 ? (
                            <div className="operations-v2-empty">
                              {t("operations.history.noServiceResults")}
                            </div>
                          ) : (
                            <div className="operations-v2-history-services__list">
                              {operationView.services.map(
                                (
                                  service,
                                  index,
                                ) => {
                                  const content = (
                                    <>
                                      <div className="operations-v2-history-service__identity">
                                        <span
                                          className={
                                            "status-dot " +
                                            (
                                              service.status === "up"
                                                ? "status-dot--up"
                                                : "status-dot--down"
                                            )
                                          }
                                        />

                                        <div>
                                          <strong>
                                            {
                                              service.name ||
                                              t(
                                                "operations.history.serviceFallback",
                                                {
                                                  id: service.service_id,
                                                },
                                              )
                                            }
                                          </strong>

                                          <span>
                                            {
                                              service.endpoint ||
                                              t(
                                                "operations.history.noEndpoint",
                                              )
                                            }
                                          </span>
                                        </div>
                                      </div>


                                      <div className="operations-v2-history-service__transition">
                                        <span>
                                          {serviceStatusLabel(service.previous_status, t)}
                                        </span>

                                        <b>
                                          →
                                        </b>

                                        <strong>
                                          {serviceStatusLabel(service.status, t)}
                                        </strong>
                                      </div>


                                      <div>
                                        <span className="operations-v2-history-service__label">
                                          HTTP
                                        </span>

                                        <strong>
                                          {
                                            service.status_code ??
                                            "—"
                                          }
                                        </strong>
                                      </div>


                                      <div>
                                        <span className="operations-v2-history-service__label">
                                          {t("operations.history.latency")}
                                        </span>

                                        <strong>
                                          {
                                            service
                                              .response_time_ms != null
                                              ? `${Number(
                                                  service
                                                    .response_time_ms,
                                                ).toFixed(
                                                  1,
                                                )} ms`
                                              : "—"
                                          }
                                        </strong>
                                      </div>


                                      <div className="operations-v2-history-service__error">
                                        <span className="operations-v2-history-service__label">
                                          {t("operations.history.detail")}
                                        </span>

                                        <strong>
                                          {
                                            service.error ||
                                            t(
                                              "operations.history.noErrors",
                                            )
                                          }
                                        </strong>
                                      </div>
                                    </>
                                  );

                                  if (
                                    service.service_id ==
                                    null
                                  ) {
                                    return (
                                      <div
                                        key={
                                          service.name ||
                                          index
                                        }
                                        className="operations-v2-history-service"
                                      >
                                        {content}
                                      </div>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={
                                        service.service_id
                                      }
                                      to={`/servicios/${service.service_id}`}
                                      className="operations-v2-history-service operations-v2-history-service--link"
                                    >
                                      {content}
                                    </Link>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </>
  );
}
