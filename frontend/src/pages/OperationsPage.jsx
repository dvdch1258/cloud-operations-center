import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const latestResult =
    latestExecution?.result || null;

  const successfulExecutions =
    useMemo(
      () =>
        executions.filter(
          (execution) =>
            execution.status === "success"
        ).length,
      [executions],
    );


  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            OPERACIONES
          </p>

          <h1>Operaciones</h1>

          <p className="subtitle">
            Ejecuta acciones operativas
            controladas y consulta su
            historial de auditoría.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadExecutions}
          disabled={loading || executing}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar"}
        </button>
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
          description="Operaciones registradas"
        />

        <SummaryCard
          label="Completadas"
          value={successfulExecutions}
          description="Ejecuciones correctas"
        />

        <SummaryCard
          label="Servicios"
          value={
            latestResult?.services_checked ?? "—"
          }
          description="Última comprobación"
        />

        <SummaryCard
          label="Última duración"
          value={
            formatDuration(
              latestExecution?.duration_ms
            )
          }
          description="Tiempo de ejecución"
        />
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


        <article className="panel operations-latest-card">
          <div className="panel__header">
            <div>
              <h2>Última ejecución</h2>

              <span>
                Resultado operativo más reciente
              </span>
            </div>
          </div>

          {!latestExecution ? (
            <div className="empty-state">
              Todavía no hay ejecuciones.
            </div>
          ) : (
            <div className="operations-latest">
              <div>
                <span>Estado</span>

                <strong
                  className={
                    "operation-status " +
                    `operation-status--${latestExecution.status}`
                  }
                >
                  {statusLabel(
                    latestExecution.status
                  )}
                </strong>
              </div>

              <div>
                <span>Servicios operativos</span>
                <strong>
                  {latestResult?.services_up ?? "—"}
                </strong>
              </div>

              <div>
                <span>
                  Servicios no disponibles
                </span>
                <strong>
                  {latestResult?.services_down ?? "—"}
                </strong>
              </div>

              <div>
                <span>Ejecutado por</span>
                <strong>
                  {
                    latestExecution
                      .requested_by_username
                  }
                </strong>
              </div>

              <div>
                <span>Duración</span>
                <strong>
                  {formatDuration(
                    latestExecution.duration_ms
                  )}
                </strong>
              </div>

              <div>
                <span>Fecha</span>
                <strong>
                  {formatDate(
                    latestExecution.started_at
                  )}
                </strong>
              </div>
            </div>
          )}
        </article>
      </section>


      <section className="panel operations-history">
        <div className="panel__header">
          <div>
            <h2>
              Historial de operaciones
            </h2>

            <span>
              Registro auditable de las
              ejecuciones realizadas
            </span>
          </div>

          <span className="operations-history-count">
            {executions.length} registros
          </span>
        </div>


        {loading && executions.length === 0 ? (
          <div className="empty-state">
            Cargando operaciones...
          </div>
        ) : executions.length === 0 ? (
          <div className="empty-state">
            No hay operaciones registradas.
          </div>
        ) : (
          <div className="operations-history-table">
            <div className="operations-history-row operations-history-row--header">
              <span>Operación</span>
              <span>Estado</span>
              <span>Usuario</span>
              <span>Resultado</span>
              <span>Duración</span>
              <span>Fecha</span>
            </div>

            {executions.map((execution) => {
              const result =
                execution.result || {};

              return (
                <div
                  key={execution.id}
                  className="operations-history-row"
                >
                  <strong>
                    {operationLabel(
                      execution.operation
                    )}
                  </strong>

                  <span
                    className={
                      "operation-status " +
                      `operation-status--${execution.status}`
                    }
                  >
                    {statusLabel(
                      execution.status
                    )}
                  </span>

                  <span>
                    {
                      execution
                        .requested_by_username
                    }
                  </span>

                  <span>
                    {execution.status === "success"
                      ? `${result.services_up || 0}/${result.services_checked || 0} operativos`
                      : execution.error || "—"}
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
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
