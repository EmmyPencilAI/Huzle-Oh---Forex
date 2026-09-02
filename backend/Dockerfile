# HUZLE OH — AGENTIC TRADER DOCKERFILE
# Designed for 24/7 VPS deployment with Python 3.12, SQLite WAL, and supervision
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV DATABASE_PATH=/app/data/huzle_oh.db

# Mount point for persistent database
VOLUME /app/data

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
