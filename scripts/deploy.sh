#!/usr/bin/env bash

set -Eeuo pipefail

NAMESPACE="cloud-ops"
CLUSTER_NAME="cloud-ops"
IMAGE_NAME="cloud-operations-backend:latest"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 ||
  fail "Docker no está instalado o no está disponible."

command -v kubectl >/dev/null 2>&1 ||
  fail "kubectl no está instalado o no está disponible."

command -v kind >/dev/null 2>&1 ||
  fail "kind no está instalado o no está disponible."

[[ -f k8s/base/postgres/secret.yaml ]] ||
  fail "No existe k8s/base/postgres/secret.yaml"

[[ -f k8s/base/backend/migration-job.yaml ]] ||
  fail "No existe k8s/base/backend/migration-job.yaml"

[[ -f k8s/base/backend/deployment.yaml ]] ||
  fail "No existe k8s/base/backend/deployment.yaml"

log "Comprobando el clúster kind"

if ! kind get clusters | grep -qx "$CLUSTER_NAME"; then
  fail "No existe el clúster kind '$CLUSTER_NAME'."
fi

log "Construyendo la imagen del backend"

docker build \
  -t "$IMAGE_NAME" \
  ./backend

log "Cargando la imagen en kind"

kind load docker-image \
  "$IMAGE_NAME" \
  --name "$CLUSTER_NAME"

log "Aplicando el namespace"

kubectl apply -f k8s/base/namespace.yaml 2>/dev/null || true

log "Aplicando PostgreSQL"

kubectl apply -f k8s/base/postgres/secret.yaml
kubectl apply -f k8s/base/postgres/pvc.yaml
kubectl apply -f k8s/base/postgres/deployment.yaml

log "Esperando a PostgreSQL"

kubectl rollout status \
  deployment/postgres \
  -n "$NAMESPACE" \
  --timeout=180s

log "Eliminando el Job de migración anterior"

kubectl delete job backend-migrations \
  -n "$NAMESPACE" \
  --ignore-not-found

log "Ejecutando migraciones Alembic"

kubectl apply \
  -f k8s/base/backend/migration-job.yaml

if ! kubectl wait \
  --for=condition=complete \
  job/backend-migrations \
  -n "$NAMESPACE" \
  --timeout=180s; then

  kubectl logs \
    -n "$NAMESPACE" \
    job/backend-migrations || true

  fail "La migración ha fallado."
fi

log "Logs de migración"

kubectl logs \
  -n "$NAMESPACE" \
  job/backend-migrations

log "Desplegando el backend"

kubectl apply \
  -f k8s/base/backend/configmap.yaml

kubectl apply \
  -f k8s/base/backend/deployment.yaml

log "Esperando al backend"

kubectl rollout status \
  deployment/backend \
  -n "$NAMESPACE" \
  --timeout=180s

log "Estado de los pods"

kubectl get pods \
  -n "$NAMESPACE" \
  -o wide

log "Comprobando la versión de Alembic"

kubectl exec \
  -n "$NAMESPACE" \
  deployment/backend \
  -- alembic -c /app/alembic.ini current

log "Probando la conexión con PostgreSQL desde el backend"

kubectl exec \
  -n "$NAMESPACE" \
  deployment/backend \
  -- python -c '
import os
import psycopg2

connection = psycopg2.connect(os.environ["DATABASE_URL"])
cursor = connection.cursor()
cursor.execute("SELECT current_user, current_database();")
print(cursor.fetchone())
cursor.close()
connection.close()
'

log "Despliegue finalizado correctamente"

printf '\nPara probar la API, ejecuta en otra terminal:\n\n'
printf 'kubectl port-forward -n %s service/backend 8001:8000\n\n' "$NAMESPACE"
printf 'Después:\n\n'
printf 'curl -i http://localhost:8001/health\n'
printf 'curl -i http://localhost:8001/dashboard/summary\n'
