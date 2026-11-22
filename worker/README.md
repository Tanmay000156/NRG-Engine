# NRG ENGINE 2.0 — PERSISTENT EXECUTION WORKER

This is the dedicated, independent backend execution worker microservice for **NRG ENGINE 2.0**.

It runs outside Vercel Serverless Functions to provide **persistent WebSockets, child subprocess isolation, unbuffered standard I/O streaming, and live interactive stdin/terminal execution**.

---

## 1. Features
- **Persistent WebSocket Connections**: Live bi-directional streaming over `/ws` and `/api/interactive/ws`.
- **Multi-Compiler Support**: C (GCC with unbuffered constructor), C++ (G++ unbuffered), Python 3 (`python -u`), Node.js.
- **Unbuffered Prompt Streaming**: Guarantees that `printf("Enter choice: ")` flushes immediately to the terminal without requiring trailing newlines or manual `fflush(stdout)`.
- **Untrusted Code Security**:
  - Unprivileged user `nrgworker` (UID 1001).
  - Dedicated ephemeral workspace folder per execution session (`/tmp/nrg_worker_sessions/<sessionId>`).
  - Total execution timeout limit (120s) and input inactivity timeout limit (60s).
  - Process tree kill (`SIGKILL` / `taskkill /T /F`) and filesystem cleanup on exit, disconnect, or timeout.
- **CORS & Token Authentication**: Support for cross-origin frontend requests and optional `WORKER_AUTH_TOKEN`.

---

## 2. API & WebSocket Endpoints

| Endpoint | Protocol | Description |
| :--- | :--- | :--- |
| `GET /health` | HTTP | Health check probe (JSON with uptime, status, active sessions) |
| `GET /status` | HTTP | Worker status, system load, memory metrics |
| `WS /ws` | WebSocket | Primary live interactive terminal connection |
| `WS /api/interactive/ws`| WebSocket | Backwards-compatible WebSocket endpoint |
| `POST /start` | HTTP | Initialize execution session |
| `POST /input` | HTTP | Send stdin into running session |
| `POST /stop` | HTTP | Stop & terminate running session |

---

## 3. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3001` (or `10000` on Render) | HTTP and WebSocket listening port |
| `NODE_ENV` | `production` | Node environment |
| `ALLOWED_ORIGINS` | `*` | Allowed CORS origins (e.g. `https://nrg-engine.vercel.app`) |
| `WORKER_AUTH_TOKEN` | *(empty)* | Optional Bearer auth token for secured workers |

---

## 4. Deployment Instructions

### Option A: 1-Click Render Deployment (Free Tier Persistent Worker)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your repository: `https://github.com/Tanmay000156/NRG-Engine`.
3. Choose **Docker** as environment.
4. Set Dockerfile path to: `worker/Dockerfile`.
5. Set Health Check path to: `/health`.
6. Once deployed, Render gives you a domain (e.g. `https://nrg-worker.onrender.com`).
7. Your WebSocket URL will be: `wss://nrg-worker.onrender.com/ws`.

### Option B: Railway Deployment
1. In [Railway](https://railway.app), click **New Project** -> **Deploy from GitHub Repo**.
2. Select your `NRG-Engine` repository.
3. In Service Settings, set **Dockerfile Path** to `worker/Dockerfile`.
4. Generate a domain (e.g. `https://nrg-worker.up.railway.app`).
5. Your WebSocket URL will be: `wss://nrg-worker.up.railway.app/ws`.

### Option C: Docker / Self-Hosted VPS
```bash
cd worker
docker build -t nrg-interactive-worker .
docker run -d -p 3001:3001 --name nrg-worker --restart always nrg-interactive-worker
```

---

## 5. Connecting the Frontend to Your Worker

In your Vercel project environment variables (or locally via `.env` / `localStorage`):

```bash
VITE_INTERACTIVE_WORKER_URL=wss://nrg-worker.onrender.com/ws
```

Or configure it in the application UI:
1. Open NRG Engine in your browser.
2. Click the **Worker Status Badge** in the Terminal tab header.
3. Enter your persistent worker WebSocket URL (e.g. `wss://your-worker.onrender.com/ws`).
4. Click **Connect Worker** — the badge immediately updates to **✔ Worker Online**!
