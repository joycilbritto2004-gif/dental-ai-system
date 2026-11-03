# Serving container for the DentaAI inference service.
#
# TensorFlow 2.15 supports Python 3.9-3.11, so 3.12 will fail to resolve the wheel.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

# Pillow needs libjpeg/zlib at runtime; the slim image does not carry them.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libjpeg62-turbo zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first so the dependency layer is cached across code changes.
COPY requirements-serve.txt .
RUN pip install --no-cache-dir -r requirements-serve.txt

COPY app.py .
COPY best_dental_model.keras .

RUN useradd --create-home --shell /usr/sbin/nologin dentaai
USER dentaai

EXPOSE 5002

# One worker: each worker loads its own copy of the model into memory, so two workers
# double the footprint. Inference is a few hundred milliseconds, and the timeout is
# raised because the first request pays for lazy graph initialisation.
#
# Hosts that inject their own $PORT override this with their start command.
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "1", "--threads", "4", "--timeout", "120", "app:app"]
