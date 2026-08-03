#!/usr/bin/env bash

set -Eeuo pipefail

echo "Instalando Metrics Server..."

kubectl apply -f \
  https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "Aplicando configuración para kind..."

kubectl patch deployment metrics-server \
  -n kube-system \
  --type='json' \
  -p='[
    {
      "op": "replace",
      "path": "/spec/strategy/rollingUpdate/maxSurge",
      "value": 0
    },
    {
      "op": "replace",
      "path": "/spec/strategy/rollingUpdate/maxUnavailable",
      "value": 1
    },
    {
      "op": "replace",
      "path": "/spec/template/spec/containers/0/resources",
      "value": {
        "requests": {
          "cpu": "10m",
          "memory": "32Mi"
        },
        "limits": {
          "cpu": "100m",
          "memory": "128Mi"
        }
      }
    }
  ]'

ARGS="$(
  kubectl get deployment metrics-server \
    -n kube-system \
    -o jsonpath='{.spec.template.spec.containers[0].args}'
)"

if [[ "$ARGS" != *"--kubelet-insecure-tls"* ]]; then
  kubectl patch deployment metrics-server \
    -n kube-system \
    --type='json' \
    -p='[
      {
        "op": "add",
        "path": "/spec/template/spec/containers/0/args/-",
        "value": "--kubelet-insecure-tls"
      }
    ]'
fi

kubectl rollout status deployment/metrics-server \
  -n kube-system \
  --timeout=180s

echo
kubectl get apiservice v1beta1.metrics.k8s.io
echo
kubectl top nodes
