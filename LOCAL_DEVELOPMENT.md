# NRG Engine — Local Development & Deployment Guide

---

## 1. Prerequisites

- **Node.js:** `>= 18.0.0` (verified on Node.js `v24.22.1`)
- **Optional Local Compilers (Native Speed & Interactive Terminal):**
  - **C / C++:** GCC / G++ (MinGW-w64 on Windows or `build-essential` on Linux)
  - **Python Scientific Stack:** Python `3.10+` with `numpy`, `matplotlib`, `pandas`, `scipy`, `seaborn`, `pillow`, `sympy`
- **All Other Languages (Java, Rust, Go, C#, PHP, Kotlin):** Routed automatically through Judge0 CE (`https://ce.judge0.com`) with zero extra local setup required.

---

## 2. Local Setup & Running

```bash
git clone <your-repo-url>
cd NRG-Engine-main
npm install
pip install -r requirements.txt  # optional: native scientific Python plotting
npm start
```

Open **`http://localhost:3000`** in your browser (or launch via `start_nrg_engine.bat` on Windows).

### Optional Vite UI Development Server / Production Build
```bash
npm run dev:ui      # Vite dev server
npm run build:vite  # Build optimized bundle into dist/
```

---

## 3. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP + WebSocket listening port |
| `NRG_SESSION_SECRET` | CSPRNG in `.nrg_data/.session_secret` | HMAC-SHA256 signing key for cookie sessions (set explicitly in production) |
| `NRG_DATA_DIR` | `./.nrg_data` (or OS temp on serverless) | Directory for workspace JSON persistence |
| `JUDGE0_API_URL` | `https://ce.judge0.com` | Judge0 CE endpoint URL |
| `JUDGE0_API_KEY` | unset | Optional RapidAPI key for private Judge0 quota |
| `NRG_OPENAI_API_KEY` / `OPENAI_API_KEY` | unset | OpenAI / OpenAI-compatible API key (can also be supplied per-session in AI Studio / `.env`) |
| `OPENAI_BASE_URL` / `NRG_OPENAI_BASE_URL` | `https://api.openai.com/v1` | Base URL for OpenAI or custom compatible provider |
| `NRG_GEMINI_API_KEY` / `GEMINI_API_KEY` | unset | Google Gemini API key |
| `NRG_GROQ_API_KEY` / `GROQ_API_KEY` | unset | Groq Cloud API key |
| `NRG_ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY` | unset | Anthropic Claude API key |
| `OLLAMA_HOST` / `NRG_OLLAMA_HOST` | unset | Local Ollama server base URL (e.g. `http://127.0.0.1:11434`) |

Copy `.env.example` to `.env` to test locally with your preferred AI key; `server.js` loads `.env` / `.env.local` on startup without overwriting process environment variables. When no credentials are configured, AI Chat/Explain/Debug/Optimize return an honest `503 NO_AI_CREDENTIALS` setup notice instead of simulated responses.

---

## 4. Docker & Render Cloud Deployment

`render.yaml` deploys both the main IDE service (`Dockerfile`) and interactive worker (`worker/Dockerfile`) as Debian Bookworm slim containers with native **GCC**, **G++**, and preinstalled Python scientific packages (`numpy`, `matplotlib`, `pandas`, `scipy`, `seaborn`, `sympy`, `pillow`):

```bash
# Build & run locally with Docker or Docker Compose
docker compose up --build
# Or single-container build:
docker build -t nrg-engine .
docker run -p 10000:10000 -e NRG_SESSION_SECRET="replace-with-32-byte-secret" nrg-engine
```

If deployed to a lightweight Node host or Vercel (`vercel.json`) without Python wheels, `/api/execute` automatically instructs the browser client to execute Matplotlib/NumPy/Pandas code via the isolated WebAssembly worker (`public/pyodide-worker.js`).

---

## 5. Verification & Automated Test Commands

```bash
npm run test:qa          # Full backend API, security sandbox, WS & Chrome CDP E2E suite (51 checks)
npm run test:vercel      # Serverless API handler checks
npm run test:interactive # Mode B interactive subprocess & SSE tests
npm run test:worker      # Standalone WebSocket worker tests
npm run test:security    # Backend rate-limit & health tests
npm run test:langs       # Live 10-language Judge0 CE verification
```
