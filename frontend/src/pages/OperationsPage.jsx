import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { api } from "../api/client";


function operationLabel(operation) {
  if (operation === "service_health_check") {
    return "Comprobación de servicios";
  }

  return operation || "Operación";
}


function statusLabel(status) {
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


function serviceStatusLabel(status) {
  switch (status) {
    case "up":
      return "Operativo";
    case "down":
      return "No disponible";
    case "unknown":
      return "Desconocido";
    default:
      return status || "Desconocido";
  }
}


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
        `Comprobación completada: ` +
        `${result.services_up || 0} operativos, ` +
        `${result.services_down || 0} no disponibles.`
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

  const latestResult =
    latestOperation.result;

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
      ? "Esperando datos operativos"
      : latestOperation.hasOperationalIssues
        ? "La última ejecución requiere atención"
        : "Operación estable";


  const latestStatusDescription =
    !latestExecution
      ? "Ejecuta una comprobación para obtener el estado actual."
      : latestOperation.hasOperationalIssues
        ? `${latestOperation.servicesDown} servicios no disponibles · ${latestOperation.automationFailures + latestOperation.automationErrors} problemas de automatización`
        : `${latestOperation.servicesUp}/${latestOperation.servicesChecked} servicios operativos`;


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
            operationLabel(
              execution.operation,
            ),
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
            OPERATIONS CONTROL
          </p>

          <h1>
            Centro de operaciones
          </h1>

          <p className="subtitle">
            Ejecuta acciones controladas,
            supervisa su resultado y revisa
            la actividad operativa de la plataforma.
          </p>
        </div>

        <div className="operations-v2__header-actions">
          <div className="operations-v2__last-run">
            <span>
              Última ejecución
            </span>

            <strong>
              {latestExecution
                ? formatDate(
                    latestExecution.started_at,
                  )
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
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </header>


      {error && (
        <section className="alert alert--error">
          <strong>
            No se pudo completar la operación
          </strong>

          <span>{error}</span>
        </section>
      )}


      {successMessage && (
        <section className="alert alert--success">
          <strong>
            Operación completada
          </strong>

          <span>{successMessage}</span>
        </section>
      )}


      <section className="operations-summary-grid">
        <SummaryCard
          label="Ejecuciones"
          value={executions.length}
          description={
            `${completedExecutions} finalizadas`
          }
        />

        <SummaryCard
          label="Fiabilidad"
          value={
            successRate != null
              ? `${successRate}%`
              : "—"
          }
          description={
            failedExecutions > 0
              ? `${failedExecutions} fallidas`
              : "Sin fallos registrados"
          }
        />

        <SummaryCard
          label="Servicios"
          value={
            latestExecution
              ? latestOperation.servicesChecked
              : "—"
          }
          description={
            latestExecution
              ? `${latestOperation.servicesUp} operativos · ${latestOperation.servicesDown} no disponibles`
              : "Esperando ejecución"
          }
        />

        <SummaryCard
          label="Automatizaciones"
          value={
            latestExecution
              ? latestOperation.automationExecutions
              : "—"
          }
          description={
            latestExecution
              ? `${latestOperation.automationFailures + latestOperation.automationErrors} incidencias`
              : "Última ejecución"
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
              ? `Ejecución #${latestExecution.id}`
              : "Sin ejecución"}
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
                HEALTH CHECK
              </p>

              <h2>
                Comprobar servicios
              </h2>

              <p>
                Ejecuta una comprobación
                inmediata de todos los servicios
                registrados y actualiza su estado.
              </p>
            </div>

            <span className="operations-action-icon">
              ✓
            </span>
          </div>


          <div className="operations-action-details">
            <div>
              <span>Tipo</span>
              <strong>
                Acción controlada
              </strong>
            </div>

            <div>
              <span>Auditoría</span>
              <strong>
                Usuario y resultado
              </strong>
            </div>

            <div>
              <span>Impacto</span>
              <strong>
                Comprobación HTTP
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
              ? "Comprobando servicios..."
              : "Comprobar servicios"}
          </button>
        </article>


        {/* OPERATIONS_V2_LATEST_EXECUTION */}
        <article className="panel operations-latest-card operations-v2-latest">
          <div className="panel__header operations-v2-latest__header">
            <div>
              <p className="eyebrow">
                ÚLTIMA EJECUCIÓN
              </p>

              <h2>
                Resultado operativo
              </h2>

              <span>
                Resumen de la comprobación más reciente
              </span>
            </div>

            {latestExecution && (
              <span
                className={
                  "operation-status " +
                  `operation-status--${latestExecution.status}`
                }
              >
                {statusLabel(
                  latestExecution.status,
                )}
              </span>
            )}
          </div>

          {!latestExecution ? (
            <div className="empty-state">
              Todavía no hay ejecuciones.
            </div>
          ) : (
            <>
              <div className="operations-v2-latest__meta">
                <div>
                  <span>
                    Ejecución
                  </span>

                  <strong>
                    #{latestExecution.id}
                  </strong>
                </div>

                <div>
                  <span>
                    Usuario
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
                    Duración
                  </span>

                  <strong>
                    {formatDuration(
                      latestExecution.duration_ms,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Fecha
                  </span>

                  <strong>
                    {formatDate(
                      latestExecution.started_at,
                    )}
                  </strong>
                </div>
              </div>


              <div className="operations-v2-latest__summary">
                <div>
                  <span>
                    Servicios comprobados
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
                    Operativos
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
                    No disponibles
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
                    Cambios detectados
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
                          Cambios de estado
                        </strong>

                        <small>
                          Servicios modificados durante la ejecución
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
                      No se detectaron cambios de estado.
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
                                {service.previous_status || "—"}
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
                                {service.status}
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}

                  {latestOperation.changedServices.length > 6 && (
                    <div className="operations-v2-more">
                      +
                      {
                        latestOperation
                          .changedServices
                          .length - 6
                      } cambios adicionales
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
                          Incidentes
                        </strong>

                        <small>
                          Efectos detectados por la comprobación
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="operations-v2-impact-grid">
                    <div>
                      <span>
                        Creados
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
                        Resueltos
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
                        Degradados
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
                        Recuperados
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
                          Automatizaciones
                        </strong>

                        <small>
                          Acciones disparadas por cambios operativos
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="operations-v2-impact-grid">
                    <div>
                      <span>
                        Eventos
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
                        Ejecuciones
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
                        Fallidas
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
                        Errores
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
                    Error de ejecución
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
              AUDITORÍA OPERATIVA
            </p>

            <h2>
              Historial de operaciones
            </h2>

            <span>
              Explora ejecuciones y revisa
              el resultado de cada servicio.
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
              Buscar
            </span>

            <input
              type="search"
              value={historySearch}
              placeholder="Operación, usuario o servicio..."
              onChange={(event) =>
                setHistorySearch(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Estado
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
              Solo con incidencias
              {historyIssueCount > 0
                ? ` · ${historyIssueCount}`
                : ""}
            </span>
          </label>
        </div>


        {loading && executions.length === 0 ? (
          <div className="empty-state">
            Cargando operaciones...
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="empty-state">
            {executions.length === 0
              ? "No hay operaciones registradas."
              : "Ninguna ejecución coincide con los filtros."}
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
                            {operationLabel(
                              execution.operation,
                            )}
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
                        {statusLabel(
                          execution.status,
                        )}
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
                              operativos
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
                              no disponibles
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
                          duración
                        </span>
                      </div>

                      <time
                        dateTime={
                          execution.started_at ||
                          ""
                        }
                      >
                        {formatDate(
                          execution.started_at,
                        )}
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
                              Servicios
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
                              Cambios
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
                              Incidentes
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
                              creados / resueltos
                            </small>
                          </div>

                          <div>
                            <span>
                              Automatizaciones
                            </span>

                            <strong>
                              {
                                operationView
                                  .automationExecutions
                              }
                            </strong>

                            <small>
                              {
                                operationView
                                  .automationFailures +
                                operationView
                                  .automationErrors
                              }
                              {" problemas"}
                            </small>
                          </div>
                        </div>


                        {execution.error && (
                          <div className="operations-v2-execution-error">
                            <strong>
                              Error de ejecución
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
                                Servicios comprobados
                              </strong>

                              <span>
                                Resultado individual de esta ejecución
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
                              Esta ejecución no contiene
                              resultados individuales de servicios.
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
                                              `Servicio #${service.service_id}`
                                            }
                                          </strong>

                                          <span>
                                            {
                                              service.endpoint ||
                                              "Sin endpoint"
                                            }
                                          </span>
                                        </div>
                                      </div>


                                      <div className="operations-v2-history-service__transition">
                                        <span>
                                          {serviceStatusLabel(
                                            service
                                              .previous_status,
                                          )}
                                        </span>

                                        <b>
                                          →
                                        </b>

                                        <strong>
                                          {serviceStatusLabel(
                                            service.status,
                                          )}
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
                                          Latencia
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
                                          Detalle
                                        </span>

                                        <strong>
                                          {
                                            service.error ||
                                            "Sin errores"
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
