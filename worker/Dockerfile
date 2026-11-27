# NRG ENGINE — PERSISTENT EXECUTION WORKER CONTAINER (NRG CoreX Studios)
# Build context: repository root (`.`), matching render.yaml, worker/render.yaml, worker/railway.json, and docker-compose.yml.

FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3 \
    python3-numpy \
    python3-matplotlib \
    python3-pandas \
    python3-scipy \
    python3-pil \
    python3-seaborn \
    python3-sympy \
    procps \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY requirements.txt ./
RUN python3 -c "import numpy, matplotlib, pandas, scipy, seaborn, PIL, sympy"

COPY api/ ./api/

WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json ./
RUN npm ci --omit=dev
COPY worker/worker.js ./

RUN useradd -m -u 1001 nrgworker && \
    mkdir -p /tmp/nrg_worker_sessions /app/.nrg_data && \
    chown -R nrgworker:nrgworker /tmp/nrg_worker_sessions /app

USER nrgworker

ENV PORT=3001
ENV NODE_ENV=production
ENV MPLBACKEND=Agg

EXPOSE 3001

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "worker.js"]
