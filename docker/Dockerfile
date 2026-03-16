FROM python:3.11-slim

WORKDIR /app

ARG DEPTHMAPX_VERSION=v0.8.0

# Install system dependencies
RUN printf '%s\n' \
    'Types: deb' \
    'URIs: https://mirrors.tuna.tsinghua.edu.cn/debian' \
    'Suites: trixie' \
    'Components: main' \
    'Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg' \
    '' \
    'Types: deb' \
    'URIs: https://mirrors.tuna.tsinghua.edu.cn/debian-security' \
    'Suites: trixie-security' \
    'Components: main' \
    'Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg' \
    > /etc/apt/sources.list.d/debian.sources \
    && apt-get update -o Acquire::Retries=3 \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gcc \
    libexpat1 \
    && rm -rf /var/lib/apt/lists/*

# Install depthmapX CLI
RUN curl -fL "https://github.com/SpaceGroupUCL/depthmapX/releases/download/${DEPTHMAPX_VERSION}/depthmapXcli_linux64" \
    -o /usr/local/bin/depthmapXcli \
    && chmod +x /usr/local/bin/depthmapXcli

ENV DEPTHMAPX_CLI_PATH=/usr/local/bin/depthmapXcli

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
