# NRG ENGINE — PRODUCTION CONTAINER (NRG CoreX Studios)
# Full server container with Node.js, GCC/G++, and Scientific Python (Matplotlib, NumPy, Pandas, SciPy, Pillow, Seaborn, SymPy)

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
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY requirements.txt ./
RUN python3 -c "import numpy, matplotlib, pandas, scipy, seaborn, PIL, sympy"

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js index.html ./
COPY api/ ./api/
COPY public/ ./public/
COPY assets/ ./assets/

RUN useradd -m -u 1001 nrguser && \
    mkdir -p /app/.nrg_data /tmp/nrg_compile_cache && \
    chown -R nrguser:nrguser /app /tmp/nrg_compile_cache

USER nrguser

ENV PORT=10000
ENV NODE_ENV=production
ENV MPLBACKEND=Agg

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
