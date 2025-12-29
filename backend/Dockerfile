FROM python:3.11-slim AS base

WORKDIR /app
ENV PYTHONPATH=/app

ARG BACKEND_PORT
ENV BACKEND_PORT=${BACKEND_PORT}

ARG ALLOWED_ORIGINS
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS development

COPY src ./src
COPY run-dev.py .

CMD ["python", "run-dev.py"]

FROM base AS production

COPY src ./src
COPY run-prod.py .

CMD ["python", "run-prod.py"]
