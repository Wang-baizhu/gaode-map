FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY pyproject.toml README.md ./

# Install dependencies directly from pyproject.toml
RUN pip install --no-cache-dir .

# Copy application code
COPY . .

# Exposure
EXPOSE 8000

# Command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
