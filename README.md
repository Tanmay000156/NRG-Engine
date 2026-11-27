# NRG Engine — Polyglot Developer Platform

**Studio:** NRG CoreX Studios  
**Creator:** Developed by Tanmay NRG  
**License:** MIT

NRG Engine is a browser-based polyglot IDE and multi-runtime execution platform supporting **10 programming languages** (C, C++, Python, JavaScript, Java, C#, Go, Rust, PHP, Kotlin) across local workstations, Docker containers (Render), and Vercel serverless deployments.

---

## Core Capabilities

- **Multi-Runtime Compilation & Scientific Python Parity:**
  - Native isolated sandboxes for C, C++, Python, and Node.js with SHA-256 compilation binary caching (`api/_compile_cache.js`), `10s` compile limits, and `30s` max execution limits.
  - Portable `<conio.h>` compatibility layer (`clrscr`, `clreol`, `gotoxy`, `textcolor`) with virtual ANSI screen clearing across both the Terminal and Output workspace panels.
  - Judge0 CE execution across all 10 languages, plus automatic **Pyodide WebAssembly** client fallback (`public/pyodide-worker.js`) so `matplotlib`, `numpy`, `pandas`, `scipy`, `pillow`, and `sympy` work identically even on serverless/Node-only cloud hosts.
- **NRG Studio Workbench UI & AI Chat Studio:**
  - Studio command bar (`Home`, `IDE Studio`, `Projects`, `Templates`, `Snippets`, `Collab`, `Settings`), left `56px` activity rail, 2-column compact language & guardrails dock, center split editor/terminal/graphics stage, right docked **AI Studio & Streaming Chat** panel, Bento Home dashboard, and split-sidebar Settings (`Glass Light` & `Crystal Obsidian`, `Plus Jakarta Sans` + `Inter` + `JetBrains Mono` / `Fira Code`).
  - Language-aware syntax highlighting, cursor bracket matching, gutter code folding, interactive Project Explorer with dependency inspection, multi-tab workspace with crash recovery, minimap, and floating Find & Replace.
  - Real LLM-backed inline & multiline ghost code prediction (`Tab` accepts, `Esc` dismisses, `Ctrl+Enter` runs code without inserting newlines), plus SSE-streaming **AI Chat Studio** (`Explain`, `Debug`, `Optimize`, `Dependencies`) supporting Gemini, OpenAI, Groq, Anthropic Claude, Ollama, and custom OpenAI-compatible endpoints without fabricated fallback outputs.
- **Live Collaboration & Observability:**
  - Real-time WebSocket (`/api/collab/ws`) + cross-tab `BroadcastChannel` collaboration rooms with participant roster, live buffer sync, and shareable `?room=` URLs.
  - Built-in **Analytics**, **Problems**, **Run History**, and **System Diagnostics** docks, plus a 10-category searchable Settings hub and signed HttpOnly session/project storage (`/api/auth`, `/api/projects`).

---

## Quick Start

```bash
npm install
npm start
# Open http://localhost:3000
```

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for Docker/Render/Vercel setup and environment variables, [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) for subsystem details, [SECURITY.md](SECURITY.md) for isolation controls, and [HEALTH_REPORT.md](HEALTH_REPORT.md) for verified test reports.
