#!/usr/bin/env bash

set -Eeuo pipefail

NAMESPACE="cloud-ops"
SERVICE="backend"
LOCAL_PORT="8001"
DURATION="120"

echo "Iniciando port-forward..."
kubectl port-forward \
  -n "$NAMESPACE" \
  service/"$SERVICE" \
  "${LOCAL_PORT}:8000" \
  >/tmp/backend-port-forward.log 2>&1 &

PORT_FORWARD_PID=$!

cleanup() {
  kill "$PORT_FORWARD_PID" 2>/dev/null || true
}

trap cleanup EXIT

sleep 3

echo "Generando carga durante ${DURATION} segundos..."

end=$((SECONDS + DURATION))

while [ "$SECONDS" -lt "$end" ]; do
  for _ in $(seq 1 20); do
    curl -fsS \
      "http://localhost:${LOCAL_PORT}/dashboard/summary" \
      >/dev/null &
  done

  wait
done

echo "Prueba terminada."
