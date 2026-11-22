# NRG ENGINE 2.0 — PERSISTENT EXECUTION WORKER CONTAINER
# Complete multi-compiler sandbox environment: Node.js, GCC, G++, Python 3

FROM node:20-bookworm-slim

# Install C, C++, Python, Make, procps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3 \
    python3-pip \
    procps \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Alias python to python3
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Create working directory
WORKDIR /app

# Copy dependency definition and install
COPY package.json ./
RUN npm install --production

# Copy worker server
COPY worker.js ./

# Create non-privileged runner user and isolated session directory
RUN useradd -m -u 1001 nrgworker && \
    mkdir -p /tmp/nrg_worker_sessions && \
    chown -R nrgworker:nrgworker /tmp/nrg_worker_sessions /app

USER nrgworker

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-3001}/health || exit 1

CMD ["node", "worker.js"]
