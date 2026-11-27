# NRG Engine — Security Architecture & Controls

**Studio:** NRG CoreX Studios  
**Scope:** Local Node server (`server.js`), API handlers (`api/*.js`), WebSocket worker (`worker/worker.js`), and client runtime (`index.html`, `public/pyodide-worker.js`).

---

## 1. Execution Sandbox & Environment Isolation

- **Zero Host Secret Inheritance:** Neither `api/_local_runner.js`, `api/_interactive_manager.js`, nor `worker/worker.js` spreads `process.env` into executed user child processes. `buildSandboxedEnv(sessionDir)` (`api/_security.js`) constructs an explicit minimal allowlist (`PATH`, OS system root/temp variables, `HOME`/`TMPDIR`/`MPLCONFIGDIR` scoped to `sessionDir`, and `MPLBACKEND=Agg`). Verified via automated canary env isolation tests (`NRG_SECRET_CANARY`) in Python, Node.js, and C.
- **Process & Resource Limits (`api/_config.js`, `api/_local_runner.js`):**
  - Compilation timeout: **10 seconds** (`COMPILE_TIMEOUT_MS = 10000`).
  - Maximum execution timeout: **30 seconds** (`MAX_EXECUTION_TIMEOUT_MS = 30000`).
  - Interactive inactivity timeout: **30 seconds** (`INACTIVITY_TIMEOUT_MS = 30000`).
  - Maximum source payload: **256 KB**; maximum stdin: **64 KB**; maximum stdout capture: **5 MB**.
  - On POSIX hosts, `applyPosixResourceLimits` enforces CPU time (`ulimit -t`), file size (`ulimit -f`), and descriptor limits (`ulimit -n`), plus full process-group tree termination (`SIGKILL` / Windows `taskkill /T /F`).
- **Static Hazard Pre-Screening (`checkStaticResourceHazards`):** Rejects unbounded process fork bombs / resource exhaustion patterns prior to compilation or spawn with HTTP `403`.
- **Per-Session Workspace Isolation:** Compilers and interpreters run in unique private temporary directories (`0o700`) cleaned immediately on exit or stop.

---

## 2. Authentication, Sessions & Owner Authorization

- **Signed Session Cookies (`api/_auth.js`):**
  - Sessions are signed with HMAC-SHA256 (`timingSafeEqual` verification) and issued via `HttpOnly; SameSite=Lax` cookies (adding `Secure` automatically when HTTPS/`x-forwarded-proto=https` is detected).
  - Signing keys come from `process.env.NRG_SESSION_SECRET` or a locally generated 32-byte CSPRNG key in `.nrg_data/.session_secret` (gitignored, mode `0o600`), with ephemeral CSPRNG fallback on read-only hosts.
- **Owner-Scoped Project Access Control (`api/projects.js`, `api/_store.js`):**
  - `GET /api/projects` returns only projects owned by the authenticated session's `userId`.
  - `DELETE /api/projects` requires an active session (`401` if unauthenticated) and rejects cross-owner modifications (`403` if `existing.ownerId !== userId`).

---

## 3. HTTP Static Serving, CORS & Header Hardening

- **Strict Public Static Allowlist (`server.js`):**
  - Explicitly blocks path traversal (`..`), hidden dotfiles (`.env`, `.git`, `.nrg_data`, `.vercel`), backend/source directories (`api/`, `worker/`, `tests/`, `node_modules/`), and root server/config files (`server.js`, `package.json`, `render.yaml`, `vercel.json`, `Dockerfile`, `vite.config.js`), returning `403` / `404`.
  - Serves only `index.html`, `/assets/*`, `/public/*` (including `/pyodide-worker.js`), and built `/dist/*` assets.
- **Security Headers (`applySecurityHeaders` in `api/_security.js`):**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` constraining scripts, workers (`blob:`, `'self'`, `cdn.jsdelivr.net`), fonts, and connections (`ws:`, `wss:`, `https:`, `'self'`).
- **Route-Aware Rate Limiting (`checkRateLimit`):** Per-IP sliding-window quotas tuned separately for `execute`, `predict`, `ai_assist`, `interactive`, `auth`, and `projects`, returning HTTP `429` with cooldown metadata when exceeded.

---

## 4. Client Runtime Security

- **HTML Escaping & Safe Rendering:** All user-supplied project names, filenames, notification messages, terminal outputs, compiler diagnostics, and collaboration messages pass through `escapeHtml()` before DOM insertion.
- **JS Graphics Isolation:** Client Canvas/WebGL scripts run inside sandboxed graphics helpers and Pyodide scientific Python scripts execute off the main UI thread inside `public/pyodide-worker.js`.
