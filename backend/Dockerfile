FROM python:3.11-slim

WORKDIR /app

ARG BACKEND_PORT
ENV BACKEND_PORT=${BACKEND_PORT}

ARG ALLOWED_ORIGINS
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY run-prod.py .

CMD ["python", "run-prod.py"]
