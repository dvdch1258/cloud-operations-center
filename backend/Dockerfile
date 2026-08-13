FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic
COPY app /app/app

ARG APP_VERSION=1.0.0
ARG BUILD_SHA=development

ENV APP_VERSION=${APP_VERSION}
ENV BUILD_SHA=${BUILD_SHA}

LABEL org.opencontainers.image.title="Cloud Operations Center Backend"
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.revision="${BUILD_SHA}"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
