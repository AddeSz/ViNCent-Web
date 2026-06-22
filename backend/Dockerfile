FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONPATH=/app

ARG BACKEND_PORT
ENV BACKEND_PORT=${BACKEND_PORT}
ARG ALLOWED_ORIGINS
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
ARG CELERY_BROKER_URL
ENV CELERY_BROKER_URL=${CELERY_BROKER_URL}
ARG CELERY_BACKEND_URL
ENV CELERY_BACKEND_URL=${CELERY_BACKEND_URL}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY data ./data
COPY run.py .

FROM base AS development
CMD ["python", "run.py", "--reload"]

FROM base AS production
CMD ["python", "run.py"]