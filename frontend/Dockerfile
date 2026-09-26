FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_APP_VERSION=1.0.1
ARG VITE_BUILD_SHA=development

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_BUILD_SHA=${VITE_BUILD_SHA}

RUN npm run build

FROM nginx:1.27-alpine

# Ensure the runtime contains the patched OpenSSL 3.3 packages.
RUN apk add --no-cache --upgrade \
    'libcrypto3>=3.3.7-r0' \
    'libssl3>=3.3.7-r0'

ARG APP_VERSION=1.0.1
ARG BUILD_SHA=development

LABEL org.opencontainers.image.title="Cloud Operations Center Frontend"
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.revision="${BUILD_SHA}"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
