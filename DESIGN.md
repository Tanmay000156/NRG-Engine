# DESIGN.md — NRG PURE GLASS Design System

> Apple-inspired Glassmorphism + Liquid Glass specification (`Pure Glass` Light & `Obsidian Glass` Dark) uniting calm frosted translucency, delicate reflective hairlines, detached floating navigation, and crisp high-contrast code & terminal surfaces.

---

## 1. Visual Theme & Atmosphere

NRG Engine (`NRG CoreX Studios` • **Developed by Tanmay NRG**) adopts **NRG PURE GLASS**: an ultra-clean, monochromatic frosted studio aesthetic. Navigation bars, floating activity rails, modals, and popovers float like precision-cut translucent acrylic over a serene cool-pearl (`#F3F5F8`) or obsidian (`#101114`) canvas with subtle sculpted Liquid Glass waves. Active source code, terminal stdout/stderr, visualizations, and streamed AI responses occupy dedicated high-readability (`0.97` opacity) planes so text stays effortless to read.

---

## 2. Color Palette & Semantic Roles

| Token / Role | Pure Glass (`glass-light` / `pure-glass`) | Obsidian Glass (`crystal-obsidian` / `obsidian-glass`) | Functional Usage |
| :--- | :--- | :--- | :--- |
| `--pg-bg` | `#F3F5F8` | `#101114` | Primary ambient application canvas |
| `--pg-surface` | `rgba(255, 255, 255, 0.72)` | `rgba(32, 35, 41, 0.76)` | Top bar, floating rail, Bento cards, Settings cards, Project cards |
| `--pg-surface-2` | `rgba(247, 249, 252, 0.78)` | `rgba(40, 43, 49, 0.68)` | Secondary nested tiles, Snapshot items, Quick Launch & composer areas |
| `--pg-surface-strong` | `rgba(255, 255, 255, 0.90)` | `rgba(42, 46, 54, 0.88)` | Popovers, dropdowns, modals, active pills, AI assistant bubbles |
| `--pg-surface-code` | `rgba(252, 253, 255, 0.97)` | `rgba(20, 22, 26, 0.97)` | High-readability syntax editor & AI code snippet cards |
| `--pg-surface-term` | `rgba(248, 249, 251, 0.98)` | `rgba(15, 17, 20, 0.98)` | Terminal & interactive execution console |
| `--pg-text-1` | `#171A21` | `#F4F5F7` | Primary headings, active states, primary UI copy |
| `--pg-text-2` | `#687080` | `#A6ADB8` | Subtitles, metadata, inactive navigation items |
| `--pg-text-3` | `#929BA8` | `#777F8C` | Muted hints, timestamps, line numbers |
| `--pg-border` | `rgba(190, 200, 214, 0.48)` | `rgba(255, 255, 255, 0.10)` | Delicate frosted `1px` architectural boundaries |
| `--pg-btn-primary` | `#171A21` | `#F0F1F3` | Primary CTA background (`Launch Editor`, `Run`, `Save Profile`, active pills) |
| `--pg-btn-primary-text` | `#FFFFFF` | `#171A21` | High-contrast text/icons on primary CTAs |
| `--pg-accent` | `#64748B` | `#AAB4C2` | Neutral slate hover borders & scrollbar accents |
| `--pg-success` / `--pg-error` | `#16A36A` / `#DC4C4C` | `#34D399` / `#F87171` | Compiler pass rate, online status pills, execution & provider errors |

---

## 3. Typography Rules

- **UI & Headings (`--font-ui` / `--font-display`):** `'Inter'`, `'Geist'`, system UI fallbacks — tight headline tracking (`-0.5px` on dashboard hero greetings `27px`), crisp medium/semibold labels (`12px–13.5px`).
- **Code & Monospace (`--font-mono` / `--editor-font-family`):** `'JetBrains Mono'`, `'Geist Mono'`, `'Fira Code'`, `'Consolas'` — user-configurable (`11px–22px`, proportional line height) across editor, ghost suggestions, and line gutter.
- **Tabular Numerals:** Enforced on KPI metrics, pass rates, compile guardrails (`10 / 30s`), and gutter indices.

---

## 4. Component Stylings

- **Floating Frosted Top Bar (`54px`):** Features monochrome `//` logo mark + `NRG Engine` wordmark, icon-labeled workspace tabs (`Home`, `Editor`, `Projects`, `Templates`, `Settings`), frosted pill `Ctrl+K` command search, AI status chip, circular glass action buttons, and circular monochrome user badge.
- **Detached Floating Left Sidebar Capsule (`56px`, `20px` radius):** Detached from viewport corners (`14px 0 16px 14px`), frosted translucent shell housing minimalist `40×40px` icon route controls (`Home`, `Projects`, `Editor`, `Templates`, `Snippets`, `Collaborate`, `Settings`).
- **Bento Home Dashboard:** Asymmetric top row (`NRG COREX STUDIO` Pure Glass Hero with sculpted pearl-liquid fold + `NRG STUDIO STATUS` readiness card with `10 Compilers Ready`), 4-card KPI strip (with monochrome execution pass progress bar), hairline-divided `Recent Projects` rows (`Open Editor →`), `Quick Files`, `Quick Launch`, `Workspace Snapshot`, `Recent Activity`, and `// Developed by Tanmay NRG` footer.
- **IDE 3-Pane Workspace & AI Studio:** Frosted glass outer frames (`backdrop-filter: blur(22px)`) wrapping high-opacity `0.97–0.98` code & terminal stages plus collapsible **AI Studio** copilot drawer.
- **Split Settings & Overlays:** Sticky left category rail paired with frosted detail cards; elevated modals, dropdowns, command palette, and bottom-right toast notifications (`blur(28px)`).

---

## 5. Depth & Glass Layering Rules

- **Stronger Glass (`--pg-blur-float`, `blur(28px)`):** Navigation bar, floating sidebar capsule, dropdowns, modals, onboarding overlay, command palette, and toast notifications.
- **Moderate Glass (`--pg-blur-surface`, `blur(22px)`):** Dashboard Bento cards, Project/Template/Snippet cards, Collaboration panels, Settings containers.
- **Mostly Opaque (`0.97–0.98`):** Active code editor canvas, terminal output log, AI code fences, and form inputs to preserve crisp legibility.

---

## 6. Do's and Don'ts

- **Do:** Keep palette restrained and monochromatic; test EVERY screen and modal in both **Pure Glass (Light)** and **Obsidian Glass (Dark)** across `1440px`, `1024px`, `768px`, and `375px` viewports.
- **Do:** Preserve all existing DOM IDs (`themeOptGlassLight`, `themeOptCrystalObsidian`, `homeWelcomeGreeting`, etc.) and `.glass-light` / `.crystal-obsidian` body classes alongside `.pure-glass` / `.obsidian-glass`.
- **Don't:** Introduce neon cyan/electric-blue borders, gold/bronze accents, heavy multi-color gradients, or horizontal page overflow (`scrollWidth <= innerWidth`).
