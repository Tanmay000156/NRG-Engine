const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Starting Master Overhaul on index.html, initial size:', html.length);

// =========================================================================
// 1. CLEAN UP CSS TOKENS & DEFINE OFFICIAL THEMES (glass-light & crystal-obsidian)
// =========================================================================

// Let's check :root tokens
const officialRootTokens = `
    /* ==========================================================================
       1. OFFICIAL THEME TOKENS: GLASS LIGHT & CRYSTAL OBSIDIAN
       ========================================================================== */
    :root,
    body.glass-light,
    body.theme-light {
      --theme-name: 'glass-light';
      --bg-ambient-1: #dbeafe;
      --bg-ambient-2: #bfdbfe;
      --bg-ambient-3: #eff6ff;
      --bg-base: #eaf2fd;
      
      --glass-panel-bg: rgba(255, 255, 255, 0.76);
      --glass-panel-border: rgba(255, 255, 255, 0.9);
      --glass-panel-shadow: 0 8px 28px rgba(0, 102, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03);
      --glass-panel-blur: blur(24px);

      --card-bg-subtle: rgba(255, 255, 255, 0.65);
      --card-border-subtle: rgba(0, 102, 255, 0.16);
      --card-bg-solid: rgba(248, 250, 252, 0.98);

      --primary-blue: #0066ff;
      --primary-blue-hover: #0052cc;
      --primary-gradient: linear-gradient(135deg, #0070f3 0%, #0051cb 100%);
      --primary-glow: 0 4px 16px rgba(0, 112, 243, 0.38);

      --text-main: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --text-dim: #94a3b8;

      --code-bg: transparent;
      --code-active-line: rgba(0, 112, 243, 0.08);
      --code-line-num: #94a3b8;
      
      --syn-keyword: #0066ff;
      --syn-preproc: #7928ca;
      --syn-string: #d73a49;
      --syn-func: #1e293b;
      --syn-type: #0066ff;
      --syn-comment: #6a737d;
      --syn-number: #005cc5;

      --pill-bg: rgba(0, 0, 0, 0.04);
      --pill-border: rgba(0, 0, 0, 0.08);

      --success-bg: #dcfce7;
      --success-text: #166534;
      --success-border: #bbf7d0;

      --radius-panel: 22px;
      --radius-card: 16px;
      --radius-btn: 12px;
      --radius-pill: 9999px;
      --radius-md: 10px;

      --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --editor-font-family: 'Consolas', 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace;
      --editor-font-size: 14.5px;
      --editor-line-height: 24px;
      --editor-tab-size: 4;

      /* Dropdown Tokens (Glass Light) */
      --dropdown-bg: rgba(255, 255, 255, 0.98);
      --dropdown-border: rgba(0, 102, 255, 0.22);
      --dropdown-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 102, 255, 0.1);
      --dropdown-header-bg: rgba(0, 102, 255, 0.05);
      --dropdown-text-main: #0f172a;
      --dropdown-text-sub: #475569;
      --dropdown-text-muted: #64748b;
      --dropdown-badge-bg: rgba(0, 102, 255, 0.1);
      --dropdown-badge-text: #0066ff;
      --dropdown-badge-border: rgba(0, 102, 255, 0.25);
      --dropdown-divider: rgba(0, 0, 0, 0.08);
      --dropdown-item-hover: rgba(0, 102, 255, 0.08);
      --dropdown-icon-stroke: #475569;
      --dropdown-icon-hover-stroke: #0066ff;
      --dropdown-danger-text: #ef4444;
      --dropdown-danger-hover-bg: rgba(239, 68, 68, 0.08);
      --dropdown-danger-hover-text: #dc2626;

      /* Modal Tokens (Glass Light) */
      --modal-overlay-bg: rgba(15, 23, 42, 0.35);
      --modal-dialog-bg: rgba(255, 255, 255, 0.97);
      --modal-dialog-border: rgba(0, 102, 255, 0.22);
      --modal-dialog-shadow: 0 24px 60px -12px rgba(0, 50, 150, 0.18), 0 0 0 1px rgba(0, 102, 255, 0.1);
      --modal-header-bg: rgba(0, 102, 255, 0.04);

      /* Graphics Workspace (Glass Light) */
      --graphics-panel-bg: rgba(255, 255, 255, 0.76);
      --graphics-toolbar-bg: rgba(255, 255, 255, 0.85);
      --graphics-viewport-bg: #f8fafc;
      --graphics-viewport-border: rgba(0, 102, 255, 0.18);
      --graphics-card-bg: rgba(255, 255, 255, 0.92);
      --graphics-card-border: rgba(0, 102, 255, 0.25);
      --graphics-preset-bg: rgba(255, 255, 255, 0.85);
      --graphics-preset-border: rgba(0, 102, 255, 0.2);
      --graphics-tool-bg: rgba(255, 255, 255, 0.85);
      --graphics-tool-border: rgba(0, 0, 0, 0.12);
      --graphics-tool-text: #0f172a;
    }

    /* Crystal Obsidian (Dark Obsidian Glassmorphism) */
    body.crystal-obsidian,
    body.theme-dark,
    body.theme-midnight {
      --theme-name: 'crystal-obsidian';
      --bg-ambient-1: #070d18;
      --bg-ambient-2: #0f172a;
      --bg-ambient-3: #030712;
      --bg-base: #060a12;

      --glass-panel-bg: rgba(11, 18, 32, 0.82);
      --glass-panel-border: rgba(56, 189, 248, 0.16);
      --glass-panel-shadow: 0 12px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(56, 189, 248, 0.08);
      --glass-panel-blur: blur(24px);

      --card-bg-subtle: rgba(15, 23, 42, 0.72);
      --card-border-subtle: rgba(56, 189, 248, 0.14);
      --card-bg-solid: rgba(11, 18, 32, 0.98);

      --text-main: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-muted: #94a3b8;
      --text-dim: #64748b;

      --code-bg: transparent;
      --code-active-line: rgba(0, 112, 243, 0.22);
      --code-line-num: #64748b;

      --syn-keyword: #38bdf8;
      --syn-preproc: #c084fc;
      --syn-string: #f87171;
      --syn-func: #e2e8f0;
      --syn-type: #38bdf8;
      --syn-comment: #94a3b8;
      --syn-number: #fbbf24;

      --pill-bg: rgba(255, 255, 255, 0.08);
      --pill-border: rgba(255, 255, 255, 0.12);

      --success-bg: rgba(22, 101, 52, 0.4);
      --success-text: #4ade80;
      --success-border: rgba(74, 222, 128, 0.35);

      /* Dropdown Tokens (Crystal Obsidian) */
      --dropdown-bg: rgba(11, 18, 32, 0.97);
      --dropdown-border: rgba(56, 189, 248, 0.28);
      --dropdown-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.2);
      --dropdown-header-bg: rgba(0, 102, 255, 0.12);
      --dropdown-text-main: #f8fafc;
      --dropdown-text-sub: #cbd5e1;
      --dropdown-text-muted: #94a3b8;
      --dropdown-badge-bg: rgba(0, 102, 255, 0.22);
      --dropdown-badge-text: #38bdf8;
      --dropdown-badge-border: rgba(56, 189, 248, 0.4);
      --dropdown-divider: rgba(255, 255, 255, 0.08);
      --dropdown-item-hover: rgba(0, 102, 255, 0.18);
      --dropdown-icon-stroke: #94a3b8;
      --dropdown-icon-hover-stroke: #38bdf8;
      --dropdown-danger-text: #f87171;
      --dropdown-danger-hover-bg: rgba(239, 68, 68, 0.16);
      --dropdown-danger-hover-text: #ef4444;

      /* Modal Tokens (Crystal Obsidian) */
      --modal-overlay-bg: rgba(3, 7, 18, 0.72);
      --modal-dialog-bg: rgba(11, 18, 32, 0.95);
      --modal-dialog-border: rgba(56, 189, 248, 0.25);
      --modal-dialog-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.2);
      --modal-header-bg: rgba(0, 102, 255, 0.1);

      /* Graphics Workspace (Crystal Obsidian) */
      --graphics-panel-bg: rgba(11, 18, 32, 0.95);
      --graphics-toolbar-bg: rgba(15, 23, 42, 0.9);
      --graphics-viewport-bg: #070d18;
      --graphics-viewport-border: rgba(56, 189, 248, 0.2);
      --graphics-card-bg: rgba(15, 23, 42, 0.92);
      --graphics-card-border: rgba(56, 189, 248, 0.28);
      --graphics-preset-bg: rgba(20, 30, 50, 0.75);
      --graphics-preset-border: rgba(56, 189, 248, 0.22);
      --graphics-tool-bg: rgba(20, 30, 50, 0.7);
      --graphics-tool-border: rgba(255, 255, 255, 0.12);
      --graphics-tool-text: #f8fafc;
    }
`;

// Replace root & theme variables block
const styleStart = html.indexOf('<style>');
const viewPortIdx = html.indexOf('/* ==========================================================================\n       2. VIEWPORT');

if (styleStart !== -1 && viewPortIdx !== -1) {
  html = html.slice(0, styleStart + 7) + '\n' + officialRootTokens + '\n    ' + html.slice(viewPortIdx);
  console.log('Replaced root & dark theme tokens with official Glass Light and Crystal Obsidian architecture');
} else {
  console.error('Could not find style tags for token replacement');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Saved token updates to index.html');
