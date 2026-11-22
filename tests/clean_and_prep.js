const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Remove everything before <!DOCTYPE html>
const docIdx = html.indexOf('<!DOCTYPE html>');
if (docIdx > 0) {
  console.log('Stripping prepended text of length:', docIdx);
  html = html.slice(docIdx);
}

// 2. Add class="theme-dark" to <body> if not present
if (html.includes('<body>')) {
  html = html.replace('<body>', '<body class="theme-dark">');
}

// 3. Make sure theme tokens are inside :root and body.theme-dark inside <style>
const rootTokens = `
      /* Dropdown Theme Tokens (Light Mode) */
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
`;

const darkTokens = `
      /* Dropdown Theme Tokens (Dark Mode) */
      --dropdown-bg: rgba(15, 23, 42, 0.96);
      --dropdown-border: rgba(0, 102, 255, 0.3);
      --dropdown-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.2);
      --dropdown-header-bg: rgba(0, 102, 255, 0.1);
      --dropdown-text-main: #f8fafc;
      --dropdown-text-sub: #cbd5e1;
      --dropdown-text-muted: #94a3b8;
      --dropdown-badge-bg: rgba(0, 102, 255, 0.18);
      --dropdown-badge-text: #38bdf8;
      --dropdown-badge-border: rgba(56, 189, 248, 0.35);
      --dropdown-divider: rgba(255, 255, 255, 0.08);
      --dropdown-item-hover: rgba(0, 102, 255, 0.16);
      --dropdown-icon-stroke: #94a3b8;
      --dropdown-icon-hover-stroke: #38bdf8;
      --dropdown-danger-text: #f87171;
      --dropdown-danger-hover-bg: rgba(239, 68, 68, 0.14);
      --dropdown-danger-hover-text: #ef4444;
`;

// Inject root tokens if not already inside :root
if (!html.includes('--dropdown-bg: rgba(255, 255, 255')) {
  const rootIdx = html.indexOf(':root {');
  if (rootIdx !== -1) {
    const insertPt = rootIdx + 7;
    html = html.slice(0, insertPt) + rootTokens + html.slice(insertPt);
    console.log('Injected root dropdown tokens');
  }
}

// Inject dark tokens if not already inside body.theme-dark
if (!html.includes('--dropdown-bg: rgba(15, 23, 42')) {
  const darkIdx = html.indexOf('body.theme-dark {');
  if (darkIdx !== -1) {
    const insertPt = darkIdx + 17;
    html = html.slice(0, insertPt) + darkTokens + html.slice(insertPt);
    console.log('Injected dark dropdown tokens');
  }
}

// Also inject into midnight theme
if (!html.includes('body.theme-midnight {\n      --dropdown-bg:')) {
  const midIdx = html.indexOf('body.theme-midnight {');
  if (midIdx !== -1) {
    const insertPt = midIdx + 21;
    html = html.slice(0, insertPt) + darkTokens + html.slice(insertPt);
    console.log('Injected midnight dropdown tokens');
  }
}

// 4. Update the boot section to start on Home
const oldBoot = `// Boot: Start in Editor View\n    navigateToSection('editor');`;
const newBoot = `// Boot: Start in Home Dashboard (matching Image 2)\n    const initSec = sessionStorage.getItem('nrg_current_section') || 'home';\n    navigateToSection(initSec);`;
if (html.includes(oldBoot)) {
  html = html.replace(oldBoot, newBoot);
  console.log('Updated boot section to start on Home Dashboard');
}

// 5. Ensure explicit dropdown rules
const explicitDropdownStyles = `
    /* Explicit Portal & Dropdown Menu Styling */
    .portal-dropdown,
    .profile-dropdown-menu,
    .notifications-dropdown-menu {
      background: var(--dropdown-bg) !important;
      border: 1px solid var(--dropdown-border) !important;
      box-shadow: var(--dropdown-shadow) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      color: var(--dropdown-text-main) !important;
    }
    .profile-dropdown-header,
    .notifications-dropdown-header {
      background: var(--dropdown-header-bg) !important;
      border-bottom: 1px solid var(--dropdown-divider) !important;
    }
    .profile-dropdown-name {
      color: var(--dropdown-text-main) !important;
    }
    .profile-dropdown-role {
      color: var(--dropdown-text-muted) !important;
    }
    .profile-dropdown-badge {
      background: var(--dropdown-badge-bg) !important;
      color: var(--dropdown-badge-text) !important;
      border: 1px solid var(--dropdown-badge-border) !important;
    }
    .profile-dropdown-divider {
      background: var(--dropdown-divider) !important;
      height: 1px !important;
    }
    .profile-dropdown-item {
      color: var(--dropdown-text-main) !important;
    }
    .profile-dropdown-item:hover,
    .profile-dropdown-item:focus {
      background: var(--dropdown-item-hover) !important;
    }
    .profile-dropdown-item.danger-item {
      color: var(--dropdown-danger-text) !important;
    }
    .profile-dropdown-item.danger-item:hover {
      background: var(--dropdown-danger-hover-bg) !important;
      color: var(--dropdown-danger-hover-text) !important;
    }
`;

if (!html.includes('/* Explicit Portal & Dropdown Menu Styling */')) {
  const styleCloseIdx = html.indexOf('</style>');
  if (styleCloseIdx !== -1) {
    html = html.slice(0, styleCloseIdx) + explicitDropdownStyles + '\n  ' + html.slice(styleCloseIdx);
    console.log('Injected explicit dropdown styles');
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html updated successfully! New length:', html.length);

// 6. Create api/git-branch.js for Vercel
const gitBranchCode = `/**
 * NRG ENGINE — VERCEL SERVERLESS FUNCTION: /api/git-branch
 * Returns git branch state for the Home Dashboard Workspace Snapshot.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ available: true, branch }));
};
`;

fs.writeFileSync(path.join(rootDir, 'api', 'git-branch.js'), gitBranchCode, 'utf8');
console.log('Created api/git-branch.js for Vercel');
