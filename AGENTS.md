# NRG Engine — Project Agent Workflow & Skill Configuration

Follow these project rules and activate the installed workspace skills automatically whenever a task touches frontend design, UI reviews, screenshot reproduction, or browser testing in `NRG-Engine-main`.

## Automatic Skill Activation Rules

1. **Frontend Design & Layout (`design-taste-frontend` — `.agents/skills/design-taste-frontend/SKILL.md`):**
   - Activate whenever designing, redesigning, restyling, or building new UI pages, dashboards, landing screens, or interactive product surfaces.
   - Follow its structural discipline: clear hierarchy, restrained palettes, consistent border geometry, real UI/product content, zero generic "AI-slop" wrappers/cards-inside-cards, and browser-verified layout alignment across `1440px`, `1024px`, `768px`, and `390px` viewports.
   - Reference Node scripts in `.agents/skills/design-taste-frontend/scripts/` (`start.mjs`, `consistency.mjs`, `gate.mjs`, `copy-lint.mjs`, `perf.mjs`, `shoot.mjs`) when building/auditing standalone pages.

2. **Web UI Quality & Accessibility Compliance (`web-design-guidelines` — `.agents/skills/web-design-guidelines/SKILL.md`):**
   - Activate whenever asked to audit UI, check accessibility, review UX compliance, or before finalizing frontend changes.
   - Read `.agents/skills/web-design-guidelines/references/command.md` and report/fix concrete `file:line` findings (ARIA labels, `<button>` vs `<div>`, `:focus-visible` states, form semantics, reduced motion, typography, overflow/safe areas, dark-mode `color-scheme` & `<select>` styling).

3. **Screenshot & Reference Reproduction (`image-to-code` — `.agents/skills/image-to-code/SKILL.md`):**
   - Activate whenever building UI from visual references or generating design comps before implementation:
     - When the user provides a screenshot/reference image: inspect its exact visual grid, section cadence, color hex palette, font hierarchy, dimensions, padding/gap rhythm, borders/radii, and component states **before** writing code, and reproduce it cleanly inside NRG Engine's native HTML/CSS/React stack.
     - When creating visual-first pages without an existing screenshot: generate clear per-section visual references first, inspect them deeply, extract tokens/components, and build to match.

4. **Consistent Visual Language (`awesome-design-md` via `DESIGN.md` & `.agents/design-references/`):**
   - Always treat [`DESIGN.md`](./DESIGN.md) as NRG Engine's visual design-system specification.
   - Keep `Crystal Obsidian` (dark) and `Glass Light` (light) synchronized through shared CSS variables in `index.html` instead of hardcoded component-level colors.
   - Consult curated developer-tool `DESIGN.md` references under `.agents/design-references/` (`cursor.DESIGN.md`, `linear.app.DESIGN.md`, `vercel.DESIGN.md`) or fetch additional brand specs from `VoltAgent/awesome-design-md` (`npx getdesign@latest add <brand>`) for architecture inspiration.

5. **Real Browser Automation & Verification (`playwright-cli` — `.agents/skills/playwright-cli/SKILL.md`):**
   - Use `npx playwright-cli` (configured via `.playwright/cli.config.json`) after frontend or full-stack edits to test navigation, tabs, buttons, dropdowns, forms, responsive layouts, console errors (`playwright-cli console warning`), and capture verification screenshots into `.playwright-cli/` or scratch directories.
   - Keep test sessions clean by closing browsers (`npx playwright-cli close` / `close-all`) when verification finishes.

## Core Project Constraints

- Preserve NRG Engine branding (`NRG Engine`, `NRG CoreX Studios`, `Developed by Tanmay NRG`), `10s` compile / `30s` execution limits, `<conio.h>` `clrscr()` ANSI behavior, Python scientific sandbox / Pyodide WASM fallback, and honest real AI provider reporting.
- Verify frontend/backend changes with `npm run build:vite`, `npm run test:qa`, and `npx playwright-cli` without committing, pushing, or exposing secrets.
