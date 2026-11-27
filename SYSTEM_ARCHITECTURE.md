# NRG Engine — System Architecture

**Studio:** NRG CoreX Studios  
**Creator:** Developed by Tanmay NRG  
**Version:** 1.0.0  

---

## 1. High-Level Architecture Overview

NRG Engine operates with dual-runtime parity across local Node.js stations, Docker containers (Render), and serverless edge environments (Vercel), combining native sandboxes, Judge0 CE remote execution, and in-browser Pyodide WebAssembly scientific Python execution.

```
[ Browser Client (index.html + Pyodide Web Worker) ]
   ├── HTTPS / Fetch REST APIs ──────────────► [ server.js / Vercel Serverless (/api/*) ]
   │     ├── /api/execute ──────────────────► [ api/_compiler.js ]
   │     │                                      ├── Native Host Sandbox (api/_local_runner.js + _compile_cache.js)
   │     │                                      ├── Judge0 CE Remote Sandbox (10 languages)
   │     │                                      └── Signal requires_client_runtime -> /pyodide-worker.js
   │     ├── /api/predict ──────────────────► [ api/_predictor.js ] (Real LLM via _ai_provider.js / AST fallback)
   │     ├── /api/ai/assist|chat|status|test► [ api/_assistant.js + api/_ai_provider.js ] (SSE Chat, Explain/Debug/Optimize/Deps)
   │     ├── /api/auth & /api/projects ─────► [ api/_auth.js + api/_store.js ] (HMAC Cookies + JSON Store)
   │     └── /api/diagnostics & /api/config ► [ api/_config.js + Toolchain Probes ]
   │
   └── WebSocket (ws / wss) ────────────────► [ api/_interactive_manager.js / worker/worker.js ]
         ├── /api/interactive/ws ───────────► Isolated Live Stdin/Stdout Interactive Subprocess (Mode B)
         └── /api/collab/ws ────────────────► Multi-User Room Roster, Chat & Code Buffer Relay
```

---

## 2. Frontend Architecture (`index.html` & `public/pyodide-worker.js`)

### Design System & Themes
- **NRG PURE GLASS Tokens (`:root`, `body.glass-light` / `body.pure-glass`, `body.crystal-obsidian` / `body.obsidian-glass`):** Centralized `--pg-*` and semantic CSS custom properties powering frosted translucent surfaces (`rgba(255,255,255,0.72)` Light `#F3F5F8` Pure Glass; `rgba(32,35,41,0.76)` Dark `#101114` Obsidian Glass), monochrome primary actions (`#171A21` / `#F0F1F3`), high-opacity (`0.97–0.98`) code/terminal planes, detached `56px` glass rail, typography (`Inter` + `Geist` + `JetBrains Mono` / `Geist Mono` / `Fira Code`), 12-column Bento dashboard cards, split-sidebar settings, right-docked **AI Studio**, and responsive breakpoints (`1440px`, `1024px`, `768px`, `375px`).
- **Workspace Persistence:** Settings persist in both `localStorage` (`nrg_app_settings`) and IndexedDB (`nrg_engine_db`), alongside server session sync (`/api/auth`, `/api/projects`).

### Core Editor & Workspace Modules
- **Single-Pass Lexer & Bracket Matcher (`tokenizeLineHtml`, `findMatchingBracketPair`):** Syntax highlighting across C, C++, Python, JavaScript, Java, C#, Go, Rust, PHP, and Kotlin with cursor-paired bracket outlines.
- **Line-Aligned Code Folding (`CodeFoldManager`):** Replaces folded `{ ... }` and Python indented blocks with traceable fold markers in the buffer while preserving vertical cursor alignment; auto-unfolds cleanly prior to compilation, formatting, or saving.
- **Project Explorer & Dependency Inspector (`ProjectExplorer`):** Multi-tab file switcher plus live `#include` / `import` / `use` / `require` scanner.
- **Inline Ghost Text & IntelliSense (`AiPredictor`, `IntelliSenseManager`):** Context-aware single/multiline ghost predictions (`Tab` accepts, `Esc` dismisses, `Ctrl+Space` triggers) plus popup symbol completion (`Ctrl+.`).
- **Crash Recovery:** Active dirty buffers snapshot to `nrg_workspace_recovery` and restore safely if reloaded unexpectedly before manual save.
- **Virtual ANSI Screen Processor (`TerminalScreenProcessor`):** Normalizes Windows CRLF (`\r\n`) and processes `\x1b[2J`, `\x1b[3J`, `\f`, `\x1b[K`, and lone `\r` overwrites. Calling C/C++ `clrscr()` clears prior output in both `#stdoutView` (Output tab) and `#termLogStream` (Terminal tab) across Mode A and Mode B.
- **Pyodide WebAssembly Client (`PyodideRuntimeClient` + `public/pyodide-worker.js`):** Lazy-spawns an isolated Web Worker loading Pyodide `v0.27.5` (`numpy`, `matplotlib`, `pandas`, `scipy`, `pillow`, `sympy`) with headless Agg PNG figure export whenever the server returns `requires_client_runtime: true`.
- **Live Collaboration (`CollabEngine`):** Connects to `/api/collab/ws` and same-origin `BroadcastChannel` for real-time participant presence, room switching, chat, and source buffer synchronization without hardcoded dummy users.

---

## 3. Backend Modules (`server.js`, `api/`, `worker/`)

| Module | Responsibility |
| :--- | :--- |
| `server.js` | HTTP + WebSocket entrypoint, `.env` loader, API router (`/api/ai/*`), allowlisted static server |
| `api/_ai_provider.js` | Unified AI resolver (key-prefix auto-routing), real HTTP/SSE provider caller (Gemini, OpenAI, Groq, Anthropic, Ollama, custom), connection tester |
| `api/_config.js` | Brand identity (`NRG Engine` / `NRG CoreX Studios`), 10s/30s execution limits, defaults |
| `api/_compiler.js` | Execution orchestrator: hazard check, compat preprocessing, local/Judge0/Pyodide routing |
| `api/_local_runner.js` | Isolated temp dir execution for C, C++, Python, Node.js, toolchain prober |
| `api/_compile_cache.js` | SHA-256 bounded LRU binary cache (max 24 entries) for instant repeat C/C++ runs |
| `api/_cpp_compat.js` | Portable `<conio.h>` ANSI shim (`clrscr`, `clreol`, `gotoxy`, `textcolor`) & unbuffering |
| `api/_graphics_bridge.js` | Auto-wrappers for Matplotlib Agg, Python Turtle, OpenCV, Pygame, C PPM/BMP, SVG, Java AWT |
| `api/_interactive_manager.js` | Interactive WebSocket subprocess sessions (`/api/interactive/ws`) & collab rooms (`/api/collab/ws`) |
| `api/_predictor.js` | Code prediction engine backed by `api/_ai_provider.js` (honest status + local AST fallback) |
| `api/_assistant.js` | AI Studio engine (`chat`, `explain`, `debug`, `optimize`, `dependencies`) with SSE streaming & zero fabricated fallback prose |
| `api/_auth.js` | HMAC-SHA256 signed `HttpOnly; SameSite=Lax` cookie session management |
| `api/_store.js` | Persistent workspace JSON store (`.nrg_data/workspace_db.json`) with memory fallback |
| `api/_security.js` | Route rate limiter, sandboxed env allowlist, static hazard scanner, CSP headers, `parseBody` |
| `worker/worker.js` | Standalone containerized WebSocket interactive worker |
