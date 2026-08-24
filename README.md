# Cloud Operations Center

> A cloud-native operations platform for service monitoring, incident management, observability, automation and disaster recovery.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Kubernetes](https://img.shields.io/badge/orchestration-Kubernetes-blue)
![GitOps](https://img.shields.io/badge/GitOps-Argo%20CD-orange)
![CI/CD](https://github.com/dvdch1258/cloud-operations-center/actions/workflows/ci-cd.yml/badge.svg)
![Observability](https://img.shields.io/badge/observability-Grafana%20Stack-orange)

**Cloud Operations Center** is a hands-on Cloud / DevOps / SRE project designed to reproduce the operational workflows used to run modern applications on Kubernetes.

It combines application development, GitOps, CI/CD, infrastructure automation, observability, service monitoring, incident management, notifications and disaster recovery in a single platform.

The goal is not only to deploy an application.

**The goal is to operate it.**

---

Pegado text(20260824-035131).txt
Documento
Pegado text(20260824-035823).txt
Documento
Pegado text(20260824-041157).txt
Documento
Pegado text(20260824-041333).txt
Documento
Pegado text(20260824-041414).txt
Documento
Pegado text(20260824-042824).txt
Documento
Pegado text(20260824-043720).txt
Documento
Pegado text(20260824-044353).txt
Documento
Pegado text(20260824-044434).txt
Documento
Analizado
from pathlib import Path
from xml.sax.saxutils import escape

out = Path("/mnt/data/cloud-operations-center-architecture.drawio")

# Helper functions
cells = []

def vertex(cid, value, x, y, w, h, style, parent="1"):
    cells.append(
        f'<mxCell id="{cid}" value="{escape(value)}" style="{style}" vertex="1" parent="{parent}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        f'</mxCell>'
    )

def edge(cid, source, target, value="", style=None, parent="1"):
    if style is None:
        style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#334155;"
    cells.append(
        f'<mxCell id="{cid}" value="{escape(value)}" style="{style}" edge="1" parent="{parent}" source="{source}" target="{target}">'
        f'<mxGeometry relative="1" as="geometry"/>'
        f'</mxCell>'
    )

# Styles
title_style = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=30;fontStyle=1;fontColor=#0F172A;"
subtitle_style = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=15;fontColor=#475569;"
section_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#CBD5E1;strokeWidth=2;arcSize=12;"
section_blue = "rounded=1;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#60A5FA;strokeWidth=2;arcSize=12;"
section_green = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F0FDF4;strokeColor=#4ADE80;strokeWidth=2;arcSize=12;"
section_purple = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FAF5FF;strokeColor=#A78BFA;strokeWidth=2;arcSize=12;"
service_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#94A3B8;strokeWidth=1.5;arcSize=10;fontSize=13;fontColor=#0F172A;align=center;verticalAlign=middle;"
service_blue = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#3B82F6;strokeWidth=1.5;arcSize=10;fontSize=13;fontColor=#0F172A;align=center;verticalAlign=middle;"
service_green = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#22C55E;strokeWidth=1.5;arcSize=10;fontSize=13;fontColor=#0F172A;align=center;verticalAlign=middle;"
service_orange = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#F59E0B;strokeWidth=1.5;arcSize=10;fontSize=13;fontColor=#0F172A;align=center;verticalAlign=middle;"
label_style = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=16;fontStyle=1;fontColor=#1E3A8A;"
small_label = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=13;fontStyle=1;fontColor=#334155;"
note_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#CBD5E1;strokeWidth=1;arcSize=8;fontSize=12;fontColor=#334155;align=left;verticalAlign=middle;spacingLeft=8;"
external_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF7ED;strokeColor=#FB923C;strokeWidth=1.5;arcSize=10;fontSize=13;fontColor=#0F172A;align=center;verticalAlign=middle;"

# Header
vertex("title", "CLOUD OPERATIONS CENTER", 30, 20, 650, 45, title_style)
vertex("subtitle", "Arquitectura de producción · Kubernetes · GitOps · Observabilidad", 32, 63, 700, 30, subtitle_style)
vertex("meta", "v1.1.x   |   production   |   UpCloud   |   HTTPS/TLS", 1110, 28, 420, 48,
       "rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#CBD5E1;strokeWidth=1.5;arcSize=10;fontSize=13;fontStyle=1;fontColor=#334155;align=center;verticalAlign=middle;")

# User / edge
vertex("users_box", "", 30, 120, 170, 520, section_style)
vertex("users_label", "ACCESO", 48, 136, 130, 28, label_style)
vertex("users", "Usuarios<br><font color='#64748B'>Navegador</font>", 52, 190, 125, 70, service_style)
vertex("internet", "Internet<br><font color='#64748B'>HTTPS</font>", 52, 300, 125, 70, service_style)
vertex("ingress", "NGINX Ingress<br><font color='#64748B'>TLS / routing</font>", 52, 420, 125, 82, service_green)
vertex("certmanager", "cert-manager<br><font color='#64748B'>Certificados TLS</font>", 52, 540, 125, 70, service_green)

# Cluster
vertex("cluster", "", 240, 120, 760, 520, section_blue)
vertex("cluster_label", "KUBERNETES (k3s) · namespace: cloud-ops", 265, 136, 500, 28, label_style)
vertex("frontend", "FRONTEND<br><b>React + Vite</b><br><font color='#64748B'>Deployment · :80</font>", 285, 205, 210, 105, service_blue)
vertex("backend", "BACKEND API<br><b>FastAPI</b><br><font color='#64748B'>Deployment · :8000</font>", 560, 205, 210, 105, service_blue)
vertex("postgres", "POSTGRESQL<br><b>PostgreSQL 16</b><br><font color='#64748B'>StatefulSet · PVC · :5432</font>", 425, 375, 220, 110, service_blue)
vertex("migration", "ALEMBIC<br><b>Migration Job</b><br><font color='#64748B'>Migraciones en despliegue</font>", 715, 375, 225, 110, service_style)
vertex("checker", "SERVICE CHECKER<br><b>CronJob</b><br><font color='#64748B'>Comprobaciones periódicas</font>", 285, 520, 210, 90, service_style)
vertex("incidents", "INCIDENT AUTOMATION<br><b>FastAPI + n8n</b><br><font color='#64748B'>Incidentes / recuperación</font>", 560, 520, 210, 90, service_style)

# Monitoring
vertex("monitoring", "", 1040, 120, 490, 520, section_green)
vertex("mon_label", "OBSERVABILIDAD · namespace: monitoring", 1065, 136, 400, 28,
       "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=16;fontStyle=1;fontColor=#166534;")
vertex("prom", "PROMETHEUS<br><font color='#64748B'>Métricas · :9090</font>", 1075, 205, 190, 78, service_green)
vertex("graf", "GRAFANA<br><font color='#64748B'>Dashboards · :3000</font>", 1300, 205, 190, 78, service_green)
vertex("loki", "LOKI<br><font color='#64748B'>Logs · :3100</font>", 1075, 315, 190, 78, service_green)
vertex("tempo", "TEMPO<br><font color='#64748B'>Trazas · :3200</font>", 1300, 315, 190, 78, service_green)
vertex("alloy", "ALLOY<br><font color='#64748B'>Recolección / envío</font>", 1075, 425, 190, 78, service_green)
vertex("alert", "ALERTMANAGER<br><font color='#64748B'>Alertas · :9093</font>", 1300, 425, 190, 78, service_green)
vertex("ksm", "kube-state-metrics<br><font color='#64748B'>Estado del clúster · :8080</font>", 1075, 535, 415, 70, service_green)

# CI/CD and GitOps
vertex("cicd", "", 30, 680, 720, 250, section_purple)
vertex("cicd_label", "CI/CD · GitHub Actions", 55, 696, 300, 28,
       "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=16;fontStyle=1;fontColor=#6B21A8;")
vertex("gitpush", "1. Push / PR<br><font color='#64748B'>GitHub</font>", 60, 755, 130, 70, service_style)
vertex("validate", "2. Validación<br><font color='#64748B'>pytest · lint · build</font>", 220, 755, 150, 70, service_style)
vertex("ghcr", "3. Build & Push<br><font color='#64748B'>GHCR</font>", 400, 755, 130, 70, service_style)
vertex("gitopsupdate", "4. Update GitOps<br><font color='#64748B'>sha-&lt;commit&gt;</font>", 560, 755, 150, 70, service_style)
vertex("cicd_note", "Las imágenes se publican en GHCR y el workflow actualiza los manifiestos Kubernetes con el SHA inmutable del commit.", 60, 850, 650, 50, note_style)

vertex("gitops", "", 790, 680, 740, 250, section_blue)
vertex("gitops_label", "GITOPS · Argo CD", 815, 696, 300, 28, label_style)
vertex("repo", "Repositorio Git<br><font color='#64748B'>k8s/base</font>", 820, 755, 150, 70, service_style)
vertex("argocd", "Argo CD<br><font color='#64748B'>Sync automático</font>", 1030, 755, 150, 70, service_blue)
vertex("k8s_target", "Kubernetes<br><font color='#64748B'>Estado deseado</font>", 1240, 755, 150, 70, service_blue)
vertex("gitops_note", "Argo CD reconcilia el estado del repositorio con el clúster y ejecuta los rollouts de backend y frontend.", 820, 850, 650, 50, note_style)

# External services / DR at bottom
vertex("external", "", 30, 960, 1500, 230, section_style)
vertex("external_label", "SERVICIOS EXTERNOS, SEGURIDAD Y DR", 55, 976, 400, 28, label_style)
vertex("upcloud", "UPCLOUD<br><font color='#64748B'>VM Ubuntu · k3s</font>", 60, 1040, 200, 85, external_style)
vertex("netbird", "NETBIRD<br><font color='#64748B'>Acceso privado / administración</font>", 310, 1040, 220, 85, external_style)
vertex("n8n", "n8n<br><font color='#64748B'>Automatización / Telegram</font>", 580, 1040, 220, 85, external_style)
vertex("r2", "CLOUDFLARE R2<br><font color='#64748B'>Backups PostgreSQL / DR</font>", 850, 1040, 240, 85, external_style)
vertex("domains", "ENDPOINTS<br><font color='#64748B'>app · api · grafana · prometheus · argocd<br>cloudopscenter.es</font>", 1140, 1040, 330, 85, external_style)

# Edges main
edge("e1", "users", "internet")
edge("e2", "internet", "ingress")
edge("e3", "certmanager", "ingress", "TLS", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#22C55E;dashed=1;")
edge("e4", "ingress", "frontend")
edge("e5", "frontend", "backend", "REST / JSON")
edge("e6", "backend", "postgres")
edge("e7", "migration", "postgres", "schema", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#64748B;dashed=1;")
edge("e8", "checker", "backend", "checks", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#64748B;dashed=1;")
edge("e9", "backend", "incidents")

# observability
edge("e10", "backend", "prom", "metrics", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#16A34A;dashed=1;")
edge("e11", "alloy", "loki", "logs", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#16A34A;")
edge("e12", "alloy", "tempo", "traces", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#16A34A;")
edge("e13", "prom", "graf")
edge("e14", "loki", "graf")
edge("e15", "tempo", "graf")
edge("e16", "prom", "alert")
edge("e17", "alert", "n8n", "webhook", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#F59E0B;dashed=1;")

# CI/CD flow
edge("e18", "gitpush", "validate")
edge("e19", "validate", "ghcr")
edge("e20", "ghcr", "gitopsupdate")
edge("e21", "gitopsupdate", "repo")
edge("e22", "repo", "argocd")
edge("e23", "argocd", "k8s_target")
edge("e24", "k8s_target", "cluster", "sync", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#2563EB;dashed=1;")

# DR / external
edge("e25", "postgres", "r2", "backup", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#F97316;dashed=1;")
edge("e26", "netbird", "cluster", "admin", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#F97316;dashed=1;")
edge("e27", "upcloud", "cluster", "hosts", "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=#F97316;dashed=1;")

xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-08-24T06:20:00.000Z" agent="ChatGPT" version="24.7.17">
  <diagram id="cloud-ops-architecture" name="Arquitectura">
    <mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {''.join(cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''

out.write_text(xml, encoding="utf-8")
print(f"Creado: {out}")
print(f"Tamaño: {out.stat().st_size} bytes")

STDOUT/STDERR
Creado: /mnt/data/cloud-operations-center-architecture.drawio
Tamaño: 23929 bytes


Sí. Te he preparado una versión editable directamente en draw.io/diagrams.net, ya adaptada a la arquitectura real del proyecto y usando UpCloud.

Descargar archivo editable de draw.io

1. Abrirlo en draw.io

Entra en diagrams.net y selecciona:

File → Import From → Device

y abre:

cloud-operations-center-architecture.drawio

Todos los bloques, textos, flechas y secciones son editables.

Cuando lo tengas como quieras, te recomiendo exportarlo también como:

cloud-operations-center-architecture.svg

desde:

File → Export as → SVG

Para GitHub prefiero SVG frente a PNG porque se mantiene nítido aunque amplíes la imagen.

2. Dónde guardarlo en tu repositorio

La estructura profesional que usaría es:

cloud-operations-center/
├── backend/
├── frontend/
├── k8s/
├── docs/
│   └── architecture/
│       ├── cloud-operations-center-architecture.drawio
│       └── cloud-operations-center-architecture.svg
├── README.md
└── ...

El .drawio queda como fuente editable y el .svg es lo que mostraremos en el README.

En el servidor:

cd /opt/cloud-operations-center

git switch main
git pull --ff-only origin main

git switch -c docs/v1.1-architecture

mkdir -p docs/architecture
3. Pasarlo desde tu PC al servidor

Después de descargar el .drawio, desde PowerShell de Windows, no desde la consola SSH:

scp "$env:USERPROFILE\Downloads\cloud-operations-center-architecture.drawio" root@194.62.97.22:/opt/cloud-operations-center/docs/architecture/

Después de abrirlo en draw.io y exportarlo a SVG:

scp "$env:USERPROFILE\Downloads\cloud-operations-center-architecture.svg" root@194.62.97.22:/opt/cloud-operations-center/docs/architecture/

Entonces en UpCloud:

cd /opt/cloud-operations-center

ls -lh docs/architecture/

Deberíamos tener:

cloud-operations-center-architecture.drawio
cloud-operations-center-architecture.svg
4. Mostrarlo en el README de GitHub

En tu README.md, pondría una sección bastante arriba, después de la introducción del proyecto:

## Arquitectura

Cloud Operations Center está desplegado sobre Kubernetes y utiliza una arquitectura
GitOps con observabilidad completa, CI/CD automatizado y mecanismos de backup y
recuperación ante desastres.

<p align="center">
  <img
    src="docs/architecture/cloud-operations-center-architecture.svg"
    alt="Arquitectura de Cloud Operations Center"
    width="100%"
  />
</p>

> El diagrama editable está disponible en
> [`docs/architecture/cloud-operations-center-architecture.drawio`](docs/architecture/cloud-operations-center-architecture.drawio).

Esto hace que alguien que entre a tu GitHub vea directamente el diagrama:

README → arquitectura visual

y además pueda acceder al archivo editable.

5. Subirlo profesionalmente

Como ya estamos trabajando con PRs, no lo metería directamente en main.

Una vez tengas los dos archivos:

cd /opt/cloud-operations-center

git status --short

git add \
  docs/architecture/cloud-operations-center-architecture.drawio \
  docs/architecture/cloud-operations-center-architecture.svg \
  README.md

git diff --check

git commit -m "docs: add production architecture diagram"

git push -u origin docs/v1.1-architecture

Después hacemos un PR como hicimos con /sistema.

Un detalle importante: todavía no hagas el commit. Primero pon el .drawio en docs/architecture, ábrelo en draw.io, expórtalo como SVG y pásame una captura si quieres. Podemos dejar el diagrama mucho más espectacular antes de que pase definitivamente al README del portfolio. 

Perfecto. Entonces la documentación de arquitectura ya queda actualizada y podemos cerrarla correctamente en Git.

Ejecuta esto para revisar qué archivos has cambiado:

cd /opt/cloud-operations-center

git status --short
git diff --check

Si aparece docs/architecture.md y, en su caso, los archivos .drawio / .svg, súbelos en una rama dedicada:

git switch -c docs/v1.1-architecture

git add docs/architecture.md docs/architecture/ 2>/dev/null || \
git add docs/architecture.md

git commit -m "docs: update production architecture documentation"

git push -u origin docs/v1.1-architecture

Después creamos el PR y lo pasamos por el mismo flujo limpio que las features anteriores.

Una vez cerrada esta parte, el siguiente paso de v1.1 sería mejorar el README.md con una presentación más visual: arquitectura, capturas reales de Resumen, Servicios, Incidentes, Sistema, Grafana y Argo CD, y una sección breve de demo/funcionalidades. Eso es probablemente lo que más va a mejorar ahora la presentación del proyecto en GitHub.

root@cloud-ops:/opt/cloud-operations-center# cd /opt/cloud-operations-center

git status --short
git diff --check
root@cloud-ops:/opt/cloud-operations-center# cd /opt/cloud-operations-center

git status --short
git diff --check
root@cloud-ops:/opt/cloud-operations-center# git switch -c docs/v1.1-architecture

git add docs/architecture.md docs/architecture/ 2>/dev/null || \
git add docs/architecture.md

git commit -m "docs: update production architecture documentation"

git push -u origin docs/v1.1-architecture
fatal: a branch named 'docs/v1.1-architecture' already exists
On branch docs/v1.1-architecture
nothing to commit, working tree clean
Enumerating objects: 59, done.
Counting objects: 100% (59/59), done.
Delta compression using up to 4 threads
Compressing objects: 100% (36/36), done.
Writing objects: 100% (38/38), 7.65 KiB | 1.91 MiB/s, done.
Total 38 (delta 26), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (26/26), completed with 16 local objects.
remote: 
remote: Create a pull request for 'docs/v1.1-architecture' on GitHub by visiting:
remote:      
https://github.com/dvdch1258/cloud-operations-center/pull/new/docs/v1.1-architecture
remote: 
To github.com:dvdch1258/cloud-operations-center.git
 * [new branch]      docs/v1.1-architecture -> docs/v1.1-architecture
branch 'docs/v1.1-architecture' set up to track 'origin/docs/v1.1-architecture'.
root@cloud-ops:/opt/cloud-operations-center# 

Está bien. Ese fatal solo indica que la rama ya existía, y después Git confirmó que estabas en ella. Además, el push terminó correctamente.

Antes de abrir el PR, comprueba exactamente qué contiene la rama:

cd /opt/cloud-operations-center

echo "========== ESTADO =========="
git status

echo
echo "========== COMMITS DE ESTA RAMA =========="
git log --oneline main..HEAD

echo
echo "========== CAMBIOS RESPECTO A MAIN =========="
git diff --stat main...HEAD

Si ahí aparecen los cambios de docs/architecture.md y/o los archivos del diagrama, crea el PR:

gh pr create \
  --repo dvdch1258/cloud-operations-center \
  --base main \
  --head docs/v1.1-architecture \
  --title "docs: update production architecture documentation" \
  --body "$(cat <<'EOF'
## Summary

Updates the Cloud Operations Center architecture documentation to reflect the current production platform.

### Documentation

- Replaces the old future architecture description
- Documents the current Kubernetes/k3s deployment
- Documents frontend, backend and PostgreSQL architecture
- Adds the complete observability stack
- Documents OpenTelemetry and distributed tracing
- Documents service checking and incident automation
- Describes the GitHub Actions CI/CD pipeline
- Documents the Argo CD GitOps deployment flow
- Documents ingress, TLS and production endpoints
- Documents platform health checks
- Documents PostgreSQL backup and disaster recovery
- Documents secure administration with NetBird
- Updates the main technology stack

### Infrastructure covered

- Kubernetes / k3s
- Argo CD
- GitHub Actions
- GHCR
- Prometheus
- Grafana
- Loki
- Tempo
- Alloy
- kube-state-metrics
- Alertmanager
- n8n
- PostgreSQL
- Cloudflare R2
- cert-manager
- NGINX Ingress
- NetBird
EOF
)"

Obtén el número:

PR_NUMBER=$(gh pr list \
  --repo dvdch1258/cloud-operations-center \
  --head docs/v1.1-architecture \
  --state open \
  --json number \
  --jq '.[0].number')

echo "PR_NUMBER=$PR_NUMBER"

Y comprueba los checks:

gh pr checks "$PR_NUMBER" \
  --repo dvdch1258/cloud-operations-center \
  --watch

Como esto es documentación, no debería cambiar la aplicación desplegada, pero mantenemos el mismo flujo rama → PR → CI → merge. Cuando tengas la salida de git log main..HEAD y git diff --stat main...HEAD, podremos confirmar que el PR contiene exactamente lo que queremos.

Se ha pegado el markdown(4).md
Archivo
mejoremos el eadme y cerramos las ramas de authentication y architecture

Sí. He revisado el README que pegaste. La base es buena y la introducción es potente —especialmente la idea de que el objetivo no es solo desplegar la aplicación, sino operarla—, así que la he conservado.

El problema principal es que se había vuelto demasiado largo y repetitivo: Kubernetes, observabilidad, GitOps, CI/CD y backups aparecen explicados varias veces, y además todavía quedaban referencias antiguas a v1.0.0 y mejoras “planificadas” que ya hemos implementado, como la vista System y los diagramas de arquitectura.

Te he preparado una versión más limpia y orientada a portfolio:

Descargar README mejorado

Mantiene la información técnica importante, pero ahora está mejor jerarquizada: presentación → arquitectura → funcionalidades → observabilidad → Kubernetes → CI/CD → GitOps → DR → seguridad → stack → qué demuestra el proyecto.

Primero cerramos Authentication y Architecture

Antes de tocar el README en main, comprobaría los dos PR para no mezclar cambios.

En el servidor:

cd /opt/cloud-operations-center

git switch main
git fetch origin
git pull --ff-only origin main

gh pr list \
  --repo dvdch1258/cloud-operations-center \
  --state open \
  --json number,title,headRefName,baseRefName,url

Ahí deberíamos identificar:

feat/authentication
docs/v1.1-architecture

Para obtener automáticamente el PR de Authentication:

AUTH_PR=$(gh pr list \
  --repo dvdch1258/cloud-operations-center \
  --head feat/authentication \
  --state open \
  --json number \
  --jq '.[0].number')

echo "AUTH_PR=$AUTH_PR"

Y Architecture:

ARCH_PR=$(gh pr list \
  --repo dvdch1258/cloud-operations-center \
  --head docs/v1.1-architecture \
  --state open \
  --json number \
  --jq '.[0].number')

echo "ARCH_PR=$ARCH_PR"

Si ambos devuelven número, comprueba primero Authentication:

gh pr checks "$AUTH_PR" \
  --repo dvdch1258/cloud-operations-center \
  --watch

Si sale todo verde:

gh pr merge "$AUTH_PR" \
  --repo dvdch1258/cloud-operations-center \
  --squash \
  --delete-branch

Actualiza main:

git switch main
git fetch origin
git pull --ff-only origin main

Después hacemos exactamente lo mismo con Architecture:

gh pr checks "$ARCH_PR" \
  --repo dvdch1258/cloud-operations-center \
  --watch

y, si está verde:

gh pr merge "$ARCH_PR" \
  --repo dvdch1258/cloud-operations-center \
  --squash \
  --delete-branch

Finalmente:

git switch main
git fetch origin
git pull --ff-only origin main

git status
git log -8 --oneline --decorate
Después metemos el README nuevo

No lo metería dentro de Authentication ni Architecture. Una vez cerradas ambas, hacemos una tercera rama limpia:

git switch -c docs/v1.1-readme

Descarga el archivo que te he dado en tu PC y desde PowerShell súbelo sustituyendo el README:

scp "$env:USERPROFILE\Downloads\README-improved.md" root@194.62.97.22:/opt/cloud-operations-center/README.md

Después en UpCloud:

cd /opt/cloud-operations-center

git diff --check
git diff --stat
git status --short

Y antes de hacer commit podemos revisar juntos cómo ha quedado el README definitivo en GitHub.

Importante: ejecuta primero el gh pr list ... y pásame la salida. Así vemos exactamente qué número tienen Authentication y Architecture y los cerramos sin asumir nada. 

README-improved.md
Documento

Biblioteca
/
README-improved.md
Cloud Operations Center

A cloud-native operations platform for service monitoring, incident management, observability, automation and disaster recovery.








Cloud Operations Center is a hands-on Cloud / DevOps / SRE portfolio project designed to reproduce the operational workflows used to run modern applications on Kubernetes.

The goal is not only to deploy an application.

The goal is to operate it.

Overview

Cloud Operations Center combines application development, GitOps, CI/CD, observability, service monitoring, incident management, automation and disaster recovery in a single platform.

The platform provides:

Service registration and health monitoring
Automated service checks
Incident lifecycle management
Secure authentication
Operational dashboards
Metrics, logs and distributed traces
Prometheus / Alertmanager alerting
n8n and Telegram automation
GitOps deployments with Argo CD
CI/CD with GitHub Actions
Immutable container image versioning
PostgreSQL persistence and migrations
Automated PostgreSQL backups
Off-site backup replication to Cloudflare R2
Tested disaster recovery
Secure administrative access through NetBird
Architecture

<p align="center"> <img src="docs/architecture/cloud-operations-center-architecture.svg" alt="Cloud Operations Center architecture" width="100%" /> </p>

The platform runs on Kubernetes / k3s and separates application workloads from observability components.

Users
  │
  ▼
HTTPS / NGINX Ingress
  │
  ├──────────────► React Frontend
  │                    │
  │                    ▼
  └──────────────► FastAPI Backend
                       │
                       ▼
                  PostgreSQL

FastAPI ──metrics──► Prometheus ──► Grafana
FastAPI ──traces───► Tempo ───────► Grafana
FastAPI ──logs─────► Alloy ──► Loki ──► Grafana

Prometheus ──► Alertmanager ──► n8n / Telegram

GitHub ──► GitHub Actions ──► GHCR
                           │
                           ▼
                    GitOps manifests
                           │
                           ▼
                        Argo CD
                           │
                           ▼
                      Kubernetes

PostgreSQL ──► Backup CronJob ──► Cloudflare R2

For the full technical design, see:

Architecture documentation

The editable draw.io source is available under:

docs/architecture/

Core Features
Operational Dashboard

The React frontend provides a centralized operational view of the platform.

It displays:

Registered services
Healthy and unavailable services
Open incidents
Platform health
Environment information
Application version
Git build revision
Last refresh timestamp

The interface automatically refreshes operational data and also supports manual refreshes.

System Overview

The System view provides platform-level information including:

Application version
Build SHA
Environment
Kubernetes orchestration information
PostgreSQL health
Prometheus health
Tempo health
Links to Grafana, Prometheus and Argo CD
Main platform components
Service Monitoring

Services can be registered and monitored directly from the application.

A Kubernetes CronJob periodically checks configured endpoints and records their availability.

Kubernetes CronJob
        │
        ▼
 Service Checker
        │
        ▼
 Cloud Operations API
        │
        ▼
Registered Services
        │
        ▼
Status + Check History

This information is used for service state, availability history, incident detection, dashboards and alerting.

Incident Management

Cloud Operations Center implements an operational incident lifecycle:

Open
  │
  ▼
Investigating
  │
  ▼
Resolved

Incidents contain operational context such as their related service, creation time, current status and resolution information.

Incident Automation

Operational events are processed through n8n automation workflows.

Cloud Operations Center
        │
        ▼
       n8n
        │
        ▼
Detect state changes
        │
        ├── Open
        ├── Investigating
        └── Resolved
        │
        ▼
     Telegram
        │
        ▼
     Operator

The workflow tracks previously observed states so that notifications are sent when meaningful transitions occur instead of repeatedly sending the same event.

Technical infrastructure alerts are handled separately:

Prometheus
    │
    ▼
Alertmanager
    │
    ▼
   n8n
    │
    ▼
Telegram

This separates technical alert detection from incident lifecycle automation.

Observability

The observability platform covers the three primary telemetry signals:

Metrics
Logs
Traces
Prometheus

The FastAPI backend exposes Prometheus metrics for application and HTTP telemetry.

Examples include:

Request count and rate
HTTP status codes
Request latency
Process CPU and memory
Business-level operational metrics
Kubernetes workload state through kube-state-metrics
Grafana

Grafana provides dashboards for both application and infrastructure behavior.

Current visibility includes:

Backend availability
PostgreSQL availability
Kubernetes workloads
Active alerts
Backend replicas
Container restarts
CPU and memory usage
Prometheus targets
Open incidents
HTTP request rate
Error percentage
Average and p95 latency
Endpoint traffic
Logs and HTTP errors
Loki + Grafana Alloy

Application workloads write logs to stdout.

Grafana Alloy collects Kubernetes logs and forwards them to Loki, where they can be explored from Grafana.

OpenTelemetry + Tempo

The FastAPI backend is instrumented with OpenTelemetry.

Distributed traces are exported to Tempo, and trace identifiers are also included in application logs.

This enables practical correlation between:

Request
   │
   ▼
Trace ID
   ├──► Application log
   └──► Tempo trace
Kubernetes

The platform runs on k3s.

cloud-ops

Primary application workloads:

React frontend
FastAPI backend
PostgreSQL
Service Checker
Database migration jobs
PostgreSQL backup jobs
monitoring

Observability workloads:

Prometheus
Grafana
Loki
Tempo
Grafana Alloy
Alertmanager
kube-state-metrics

Additional infrastructure components are deployed and reconciled through Argo CD.

CI/CD

GitHub Actions provides the continuous integration and delivery pipeline.

Pull Requests

Pull requests validate changes without deploying them to production.

The pipeline runs:

Backend tests with pytest
Python validation
Frontend linting
Frontend production build
Main Branch

After a change is merged into main:

GitHub
   │
   ▼
GitHub Actions
   │
   ├── Backend validation
   ├── Frontend validation
   ├── Docker image builds
   └── GHCR publication
   │
   ▼
Update GitOps manifests
   │
   ▼
Git commit
   │
   ▼
Argo CD
   │
   ▼
Kubernetes rollout

Production images use immutable commit-based tags rather than latest.

Example:

cloud-operations-backend:sha-<commit>
cloud-operations-frontend:sha-<commit>

This creates a direct relationship between the Git revision, container image and Kubernetes deployment.

GitOps

Argo CD continuously reconciles the desired state stored in Git with the Kubernetes cluster.

Git acts as the source of truth for the platform.

The project separates infrastructure responsibilities across multiple Argo CD Applications, including:

Cloud Operations Center
Monitoring
Loki
Grafana Alloy
cert-manager

Automated synchronization keeps the running cluster aligned with the repository.

Health Checks

Kubernetes readiness and liveness probes are configured for application workloads.

The backend exposes:

/health

for basic health checking, and:

/health/detailed

for component state and deployment metadata.

Example:

{
  "status": "ok",
  "database": "up",
  "prometheus": "up",
  "tempo": "up",
  "version": "1.0.1",
  "build_sha": "<git-commit-sha>",
  "environment": "production"
}

The frontend System page presents this information visually.

PostgreSQL, Backups & Disaster Recovery

PostgreSQL provides persistent application storage using Kubernetes PersistentVolumeClaims.

Database schema evolution is managed with Alembic.

Automated Backups

A Kubernetes CronJob creates PostgreSQL backups using pg_dump.

PostgreSQL
    │
    ▼
  pg_dump
    │
    ▼
Backup CronJob
    │
    ├──► Local backup storage
    │
    └──► Cloudflare R2

The backup job validates the generated dump and verifies the remote object after upload.

Tested Recovery

The recovery process has been tested end-to-end:

Cloudflare R2
      │
      ▼
Download backup
      │
      ▼
Isolated PostgreSQL
      │
      ▼
Restore
      │
      ▼
Validate database

This validates the complete disaster recovery path without modifying the production database.

Networking & Security

External production traffic reaches the platform through NGINX Ingress.

HTTPS certificates are managed automatically with cert-manager.

Production endpoints include:

https://app.cloudopscenter.es
https://api.cloudopscenter.es
https://grafana.cloudopscenter.es
https://prometheus.cloudopscenter.es
https://argocd.cloudopscenter.es

Sensitive configuration is intentionally excluded from Git.

The repository does not store:

Real .env files
Real Kubernetes Secret manifests
Private keys
Certificates
Telegram credentials
Backup archives

Secure private administration is provided through NetBird.

Reliability

The platform includes multiple mechanisms designed to improve operational reliability:

Kubernetes readiness probes
Kubernetes liveness probes
PostgreSQL persistent storage
Horizontal Pod Autoscaling
Automated service checks
GitOps reconciliation
Immutable container image references
Automated PostgreSQL backups
Off-site backup replication
Tested disaster recovery
Metrics monitoring
Centralized logging
Distributed tracing
Alerting
Incident automation
Technology Stack
Area	Technology
Frontend	React + Vite
Backend	FastAPI / Python
Database	PostgreSQL 16
Migrations	Alembic
Containers	Docker
Orchestration	Kubernetes / k3s
GitOps	Argo CD
CI/CD	GitHub Actions
Container Registry	GitHub Container Registry
Metrics	Prometheus
Dashboards	Grafana
Logs	Loki
Tracing	OpenTelemetry + Tempo
Telemetry Collection	Grafana Alloy
Kubernetes Metrics	kube-state-metrics
Alerts	Alertmanager
Automation	n8n
Notifications	Telegram
TLS	cert-manager
Ingress	NGINX Ingress
Backups	PostgreSQL + Cloudflare R2
Private Access	NetBird
Repository Structure
cloud-operations-center/
├── backend/
│   ├── alembic/
│   ├── app/
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   ├── architecture.md
│   └── architecture/
├── k8s/
│   ├── argocd/
│   ├── base/
│   └── monitoring/
├── n8n/
│   └── workflows/
├── observability/
│   ├── loki/
│   ├── prometheus/
│   └── tempo/
├── scripts/
├── traffic-generator/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
└── README.md
Documentation

Additional technical documentation is available under docs/.

Key documents include:

Architecture
Product definition
API design
Data model
Alerting responsibilities
Project backlog
What This Project Demonstrates

Cloud Operations Center was designed as an end-to-end engineering project rather than an isolated web application.

It demonstrates practical experience with:

Cloud / DevOps
Docker
Kubernetes
GitHub Actions
GitOps
Argo CD
Container registries
Immutable deployments
Application Engineering
REST API development
React frontend development
Relational databases
Authentication
Database migrations
Operational health endpoints
Observability
Prometheus metrics
Grafana dashboards
Centralized logging
Distributed tracing
Alerting
Trace/log correlation
Operations & Reliability
Service monitoring
Incident management
Automated health checking
Incident lifecycle automation
Technical alerting
Backup automation
Off-site replication
Disaster recovery testing
Project Status

Latest stable release: v1.0.1

Core platform functionality is operational.

Current v1.1 work focuses on presentation, documentation and portfolio polish, including the new System view and updated architecture documentation.

Author

David C.H

Cloud / DevOps / Systems Administration portfolio project.
