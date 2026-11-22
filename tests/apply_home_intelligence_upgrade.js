const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const serverPath = path.join(rootDir, 'server.js');

// 1. UPDATE SERVER.JS TO INCLUDE /api/git-branch
let serverJs = fs.readFileSync(serverPath, 'utf8');
if (!serverJs.includes('/api/git-branch')) {
  const langEndpoint = "if (req.method === 'GET' && pathname === '/api/languages') {";
  const gitEndpoint = `// 2.5 Git Branch Endpoint
  if (req.method === 'GET' && pathname === '/api/git-branch') {
    const { execSync } = require('child_process');
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { timeout: 1000, cwd: __dirname }).toString().trim();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: true, branch }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: false }));
    }
    return;
  }

  `;
  serverJs = serverJs.replace(langEndpoint, gitEndpoint + langEndpoint);
  fs.writeFileSync(serverPath, serverJs, 'utf8');
  console.log('Updated server.js with /api/git-branch endpoint');
}

// 2. UPDATE INDEX.HTML
let html = fs.readFileSync(indexPath, 'utf8');
console.log('Original index.html length:', html.length);

// A. Theme Tokens in CSS
// Find the root theme variables
const rootVarsIdx = html.indexOf(':root {');
const rootVarsEnd = html.indexOf('/* Dark Mode (Cyber Obsidian Glass) */', rootVarsIdx);

if (rootVarsIdx === -1 || rootVarsEnd === -1) {
  throw new Error('Could not find :root variables in index.html');
}

const dropdownTokensRoot = `
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

const darkVarsIdx = html.indexOf('body.theme-dark {');
const darkVarsEnd = html.indexOf('/* Midnight Glass Theme */', darkVarsIdx);

const dropdownTokensDark = `
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

html = html.substring(0, rootVarsEnd - 4) + dropdownTokensRoot + '    }\n\n    ' + html.substring(rootVarsEnd);

const updatedDarkIdx = html.indexOf('body.theme-dark {');
const updatedDarkEnd = html.indexOf('/* Midnight Glass Theme */', updatedDarkIdx);
html = html.substring(0, updatedDarkEnd - 4) + dropdownTokensDark + '    }\n\n    ' + html.substring(updatedDarkEnd);

console.log('Injected CSS theme tokens for dropdowns');

// B. Home Dashboard & Dropdown CSS
const homeCssStart = html.indexOf('/* ==========================================================================\n       HOME DASHBOARD REFINED LAYOUT');
const homeCssEnd = html.indexOf('/* Cards Grid (Projects & Templates) */', homeCssStart);

const enhancedHomeCSS = `/* ==========================================================================
       HOME DASHBOARD REFINED LAYOUT & THEME SYSTEM (Target 1920x1080 Full HD)
       ========================================================================== */
    .home-dashboard-card {
      background: var(--glass-panel-bg);
      backdrop-filter: var(--glass-panel-blur);
      -webkit-backdrop-filter: var(--glass-panel-blur);
      border: 1px solid var(--glass-panel-border);
      border-radius: var(--radius-panel);
      box-shadow: var(--glass-panel-shadow);
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      gap: 10px;
    }

    /* Welcome Banner */
    .home-banner {
      background: linear-gradient(135deg, rgba(0, 102, 255, 0.09) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(121, 40, 202, 0.08) 100%);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: var(--radius-card);
      padding: 9px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: hidden;
    }
    .home-banner-text h2 {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .home-banner-text p {
      font-size: 11.5px;
      color: var(--text-secondary);
      margin-top: 2px;
      margin-bottom: 0;
    }
    .home-banner-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 38px;
      background: rgba(0, 102, 255, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 10px;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.18), inset 0 0 12px rgba(0, 102, 255, 0.15);
      color: #38bdf8;
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 800;
      user-select: none;
    }
    .home-banner-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Main Two-Column Grid */
    .home-main-layout {
      display: grid;
      grid-template-columns: 1.85fr 1fr;
      gap: 12px;
      align-items: start;
      flex: 1;
      min-height: 0;
    }
    @media (max-width: 1024px) {
      .home-main-layout {
        grid-template-columns: 1fr;
      }
    }

    /* --- Left Column: Workspace --- */
    .home-col-left {
      display: flex;
      flex-direction: column;
      gap: 9px;
      min-width: 0;
    }

    /* Stats Row (2 Cards: Active Projects, Code Snippets) */
    .home-stats-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 640px) {
      .home-stats-row {
        grid-template-columns: 1fr;
      }
    }
    .home-stat-box {
      background: var(--card-bg-subtle);
      border: 1px solid var(--card-border-subtle);
      border-radius: var(--radius-card);
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s ease;
    }
    .home-stat-box:hover {
      border-color: rgba(0, 102, 255, 0.35);
      box-shadow: 0 4px 16px rgba(0, 102, 255, 0.1);
    }
    .home-stat-icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: rgba(0, 102, 255, 0.12);
      border: 1px solid rgba(0, 102, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
      flex-shrink: 0;
    }
    .home-stat-val {
      font-size: 19px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.15;
    }
    .home-stat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 1px;
    }

    /* Continue Working Panel */
    .continue-working-card {
      background: var(--card-bg-subtle);
      border: 1px solid var(--card-border-subtle);
      border-radius: var(--radius-card);
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.2s ease;
    }
    .continue-working-card:hover {
      border-color: rgba(0, 102, 255, 0.35);
      box-shadow: 0 4px 16px rgba(0, 102, 255, 0.08);
    }
    .cw-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .cw-icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 102, 255, 0.12);
      border: 1px solid rgba(0, 102, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-blue);
      flex-shrink: 0;
    }
    .cw-info {
      min-width: 0;
    }
    .cw-header-line {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cw-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-main);
    }
    .cw-tag {
      font-size: 9px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }
    .cw-meta {
      font-size: 10.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1px;
    }
    .cw-btn {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Common Panel Card */
    .home-panel-card {
      background: var(--card-bg-subtle);
      border: 1px solid var(--card-border-subtle);
      border-radius: var(--radius-card);
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--glass-panel-shadow);
      transition: all 0.2s ease;
    }
    .home-panel-card:hover {
      border-color: rgba(0, 102, 255, 0.3);
    }
    .home-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .home-panel-title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .home-panel-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
    }
    .home-panel-sub {
      font-size: 10.5px;
      color: var(--text-muted);
      margin-top: 1px;
    }
    .home-panel-action {
      font-size: 11px;
      color: var(--primary-blue);
      background: transparent;
      border: 1px solid rgba(0, 102, 255, 0.25);
      border-radius: 6px;
      padding: 2px 7px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .home-panel-action:hover {
      background: rgba(0, 102, 255, 0.1);
      border-color: var(--primary-blue);
    }

    /* Recent Projects List & Rows */
    .recent-projects-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .recent-proj-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--pill-bg);
      border: 1px solid var(--pill-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .recent-proj-row:hover {
      border-color: rgba(0, 102, 255, 0.35);
      background: rgba(0, 102, 255, 0.07);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 102, 255, 0.1);
    }
    .recent-proj-left {
      display: flex;
      align-items: center;
      gap: 9px;
      min-width: 0;
    }
    .recent-proj-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .recent-proj-info {
      min-width: 0;
    }
    .recent-proj-name-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .recent-proj-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .recent-proj-tag {
      font-size: 9px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }
    .recent-proj-meta {
      font-size: 10px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1px;
    }
    .recent-proj-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .recent-proj-time {
      font-size: 10px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .recent-proj-btn {
      font-size: 10.5px;
      font-weight: 600;
      color: var(--primary-blue);
      background: transparent;
      border: 1px solid rgba(0, 102, 255, 0.3);
      border-radius: 6px;
      padding: 2px 7px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .recent-proj-row:hover .recent-proj-btn {
      background: var(--primary-blue);
      color: #fff;
      border-color: var(--primary-blue);
    }

    /* Quick Files Chips */
    .quick-files-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .quick-file-chip {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3.5px 9px;
      background: var(--pill-bg);
      border: 1px solid var(--pill-border);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .quick-file-chip:hover {
      border-color: rgba(0, 102, 255, 0.35);
      color: var(--primary-blue);
      background: rgba(0, 102, 255, 0.08);
      transform: translateY(-1px);
    }

    /* --- Right Column: Quick Launch, Snapshot & Activity --- */
    .home-col-right {
      display: flex;
      flex-direction: column;
      gap: 9px;
      min-width: 0;
    }

    /* Quick Launch 2x2 Grid */
    .quick-launch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .ql-card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 7px 9px;
      background: var(--pill-bg);
      border: 1px solid var(--pill-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    .ql-card:hover {
      border-color: rgba(0, 102, 255, 0.35);
      background: rgba(0, 102, 255, 0.07);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 102, 255, 0.09);
    }
    .ql-icon-wrap {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 102, 255, 0.12);
      border: 1px solid rgba(0, 102, 255, 0.22);
      flex-shrink: 0;
    }
    .ql-content {
      min-width: 0;
    }
    .ql-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    .ql-desc {
      font-size: 9px;
      color: var(--text-muted);
      margin-top: 1px;
      line-height: 1.2;
    }

    /* Workspace Snapshot Panel */
    .snapshot-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .snapshot-item {
      padding: 5px 8px;
      background: var(--pill-bg);
      border: 1px solid var(--pill-border);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .snapshot-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .snapshot-val {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .snap-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .snap-dot.green { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); }
    .snap-dot.red { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
    .snap-dot.blue { background: #0066ff; box-shadow: 0 0 6px rgba(0, 102, 255, 0.5); }

    /* Recent Activity Timeline */
    .activity-timeline {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding-left: 20px;
      margin-top: 2px;
    }
    .activity-timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 5px;
      bottom: 5px;
      width: 2px;
      background: rgba(56, 189, 248, 0.18);
    }
    .activity-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 10.5px;
    }
    .activity-dot {
      position: absolute;
      left: -20px;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: var(--card-bg-subtle);
      border: 1.5px solid #0066ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #38bdf8;
      box-shadow: 0 0 6px rgba(0, 102, 255, 0.3);
    }
    .activity-dot.dot-green {
      border-color: #22c55e;
      color: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.3);
    }
    .activity-dot.dot-cyan {
      border-color: #06b6d4;
      color: #06b6d4;
      box-shadow: 0 0 6px rgba(6, 182, 212, 0.3);
    }
    .activity-text {
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    .activity-time {
      font-size: 9.5px;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ==========================================================================
       PORTAL OVERLAY & DROPDOWN DYNAMIC THEME STYLING
       ========================================================================== */
    .nrg-overlay-layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 0;
      z-index: 1000;
      pointer-events: none;
    }
    .profile-dropdown-menu.portal-dropdown,
    .notifications-dropdown-menu.portal-dropdown {
      position: fixed !important;
      top: 0;
      left: 0;
      right: auto !important;
      bottom: auto !important;
      z-index: 1000 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateY(-8px) !important;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s !important;
      background: var(--dropdown-bg) !important;
      border: 1px solid var(--dropdown-border) !important;
      box-shadow: var(--dropdown-shadow) !important;
      color: var(--dropdown-text-main) !important;
      backdrop-filter: blur(24px) !important;
      -webkit-backdrop-filter: blur(24px) !important;
    }
    .profile-dropdown-menu.portal-dropdown.open,
    .notifications-dropdown-menu.portal-dropdown.open {
      opacity: 1 !important;
      visibility: visible !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }

    .profile-dropdown-header,
    .notifications-dropdown-header {
      background: var(--dropdown-header-bg) !important;
      border-radius: 8px;
    }
    .profile-dropdown-name,
    .notifications-dropdown-title span:first-child {
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
    }
    .profile-dropdown-item {
      color: var(--dropdown-text-main) !important;
    }
    .profile-dropdown-item svg {
      stroke: var(--dropdown-icon-stroke) !important;
    }
    .profile-dropdown-item:hover,
    .profile-dropdown-item:focus {
      background: var(--dropdown-item-hover) !important;
      color: var(--primary-blue) !important;
      outline: none;
    }
    .profile-dropdown-item:hover svg,
    .profile-dropdown-item:focus svg {
      stroke: var(--dropdown-icon-hover-stroke) !important;
    }
    .profile-dropdown-item-danger {
      color: var(--dropdown-danger-text) !important;
    }
    .profile-dropdown-item-danger svg {
      stroke: var(--dropdown-danger-text) !important;
    }
    .profile-dropdown-item-danger:hover,
    .profile-dropdown-item-danger:focus {
      background: var(--dropdown-danger-hover-bg) !important;
      color: var(--dropdown-danger-hover-text) !important;
    }
    .profile-dropdown-item-danger:hover svg,
    .profile-dropdown-item-danger:focus svg {
      stroke: var(--dropdown-danger-hover-text) !important;
    }

    /* Modal Specific Theming */
    .modal-dialog {
      background: var(--glass-panel-bg) !important;
      border: 1px solid var(--glass-panel-border) !important;
      color: var(--text-main) !important;
    }
    .modal-dialog h3, .modal-dialog h4 {
      color: var(--text-main) !important;
    }
    .modal-dialog p {
      color: var(--text-secondary) !important;
    }
    .modal-dialog table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .modal-dialog th, .modal-dialog td {
      padding: 7px 10px;
      font-size: 11.5px;
      text-align: left;
      border-bottom: 1px solid var(--dropdown-divider);
    }
    .modal-dialog th {
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .modal-dialog td {
      color: var(--text-main);
    }
    .kbd-chip {
      background: var(--pill-bg);
      border: 1px solid var(--pill-border);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--primary-blue);
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    `;

html = html.substring(0, homeCssStart) + enhancedHomeCSS + html.substring(homeCssEnd);
console.log('Replaced Home & Portal CSS successfully');

// C. HTML for #sectionHome
const homeSectionStart = html.indexOf('<section class="section-full-view" id="sectionHome">');
const homeSectionEnd = html.indexOf('</section>', homeSectionStart);

const updatedHomeHTML = `<section class="section-full-view" id="sectionHome">
        <div class="home-dashboard-card">
          <!-- Welcome Banner -->
          <div class="home-banner">
            <div class="home-banner-text">
              <h2>Welcome back, Tanmay! 👋</h2>
              <p>Your development workspace is ready. What would you like to work on?</p>
            </div>
            <div class="home-banner-badge" title="High-Performance Polyglot IDE">
              <span>&lt;/&gt;</span>
            </div>
            <div class="home-banner-actions">
              <button class="glass-btn glass-btn-primary" id="homeBtnGoEditor">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <span>Launch Editor</span>
              </button>
              <button class="glass-btn" id="homeBtnNewProj">
                <span>+ New Project</span>
              </button>
            </div>
          </div>

          <!-- Main Two-Column Layout (Target 1920x1080 Full HD without scroll) -->
          <div class="home-main-layout">
            <!-- LEFT COLUMN (~65% Width) -->
            <div class="home-col-left">
              <!-- Two Balanced Statistics Cards (Part 2: Last Activity Removed) -->
              <div class="home-stats-row" id="homeStatsGrid">
                <div class="home-stat-box" id="statCardProjects">
                  <div class="home-stat-icon-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div>
                    <div class="home-stat-val" id="homeStatProjectsCount">4</div>
                    <div class="home-stat-label">Active Projects</div>
                  </div>
                </div>

                <div class="home-stat-box" id="statCardSnippets">
                  <div class="home-stat-icon-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div>
                    <div class="home-stat-val" id="homeStatSnippetsCount">6</div>
                    <div class="home-stat-label">Code Snippets</div>
                  </div>
                </div>
              </div>

              <!-- Continue Working Panel (Part 5A) -->
              <div class="continue-working-card" id="homeContinueWorkingCard">
                <div class="cw-left">
                  <div class="cw-icon-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                  <div class="cw-info">
                    <div class="cw-header-line">
                      <span class="cw-title" id="cwProjName">nrg-kernel-c</span>
                      <span class="cw-tag" id="cwLangTag">C</span>
                    </div>
                    <div class="cw-meta">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      <span id="cwFileName">main.c</span> • <span id="cwLastTime">Modified 2 hours ago</span>
                    </div>
                  </div>
                </div>
                <button class="glass-btn glass-btn-primary cw-btn" id="cwActionBtn">
                  <span>Continue in Editor →</span>
                </button>
              </div>

              <!-- Recent Projects Panel -->
              <div class="home-panel-card">
                <div class="home-panel-header">
                  <div class="home-panel-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span class="home-panel-title">Recent Projects</span>
                  </div>
                  <button class="home-panel-action" id="homeBtnViewAllProjects">View All Projects ↗</button>
                </div>
                <div class="recent-projects-list" id="homeRecentProjectsList"></div>
              </div>

              <!-- Quick Files Panel -->
              <div class="home-panel-card" style="padding:8px 14px;">
                <div class="home-panel-header" style="margin-bottom:5px;">
                  <div class="home-panel-title-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span class="home-panel-title" style="font-size:12.5px;">Quick Files</span>
                  </div>
                </div>
                <div class="quick-files-chips" id="homeQuickFilesRow"></div>
              </div>
            </div>

            <!-- RIGHT COLUMN (~35% Width) -->
            <div class="home-col-right">
              <!-- Quick Launch Card -->
              <div class="home-panel-card">
                <div class="home-panel-header" style="margin-bottom:2px;">
                  <div>
                    <div class="home-panel-title-wrap">
                      <span style="color:#0066ff; font-size:15px;">⚡</span>
                      <span class="home-panel-title">Quick Launch</span>
                    </div>
                    <div class="home-panel-sub">Frequently used actions to get started faster.</div>
                  </div>
                </div>
                <div class="quick-launch-grid">
                  <div class="ql-card" id="qlNewProject" role="button" tabindex="0">
                    <div class="ql-icon-wrap" style="color:#0066ff;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    </div>
                    <div class="ql-content">
                      <div class="ql-title">New Project</div>
                      <div class="ql-desc">Create a new workspace</div>
                    </div>
                  </div>

                  <div class="ql-card" id="qlOpenProject" role="button" tabindex="0">
                    <div class="ql-icon-wrap" style="color:#0066ff;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div class="ql-content">
                      <div class="ql-title">Open Project</div>
                      <div class="ql-desc">Continue an existing project</div>
                    </div>
                  </div>

                  <div class="ql-card" id="qlTerminal" role="button" tabindex="0">
                    <div class="ql-icon-wrap" style="color:#0066ff;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                    </div>
                    <div class="ql-content">
                      <div class="ql-title">Terminal</div>
                      <div class="ql-desc">Run commands & scripts</div>
                    </div>
                  </div>

                  <div class="ql-card" id="qlGraphics" role="button" tabindex="0">
                    <div class="ql-icon-wrap" style="color:#c084fc;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"></path></svg>
                    </div>
                    <div class="ql-content">
                      <div class="ql-title">Graphics</div>
                      <div class="ql-desc">2D drawing & visual plots</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Workspace Snapshot Panel (Part 5B) -->
              <div class="home-panel-card" id="homeWorkspaceSnapshotCard">
                <div class="home-panel-header" style="margin-bottom:4px;">
                  <div class="home-panel-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span class="home-panel-title">Workspace Snapshot</span>
                  </div>
                </div>
                <div class="snapshot-grid" id="snapshotGrid">
                  <div class="snapshot-item">
                    <span class="snapshot-label">Active Project</span>
                    <span class="snapshot-val" id="snapActiveProj">nrg-kernel-c</span>
                  </div>
                  <div class="snapshot-item">
                    <span class="snapshot-label">Active File</span>
                    <span class="snapshot-val" id="snapActiveFile">main.c (C)</span>
                  </div>
                  <div class="snapshot-item">
                    <span class="snapshot-label">Last Execution</span>
                    <span class="snapshot-val" id="snapLastExec"><span class="snap-dot green"></span> Ready</span>
                  </div>
                  <div class="snapshot-item" id="snapGitBranchWrap">
                    <span class="snapshot-label">Git Branch</span>
                    <span class="snapshot-val" id="snapGitBranch"><span class="snap-dot blue"></span> main</span>
                  </div>
                </div>
              </div>

              <!-- Recent Activity Card -->
              <div class="home-panel-card">
                <div class="home-panel-header">
                  <div class="home-panel-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    <span class="home-panel-title">Recent Activity</span>
                  </div>
                  <button class="home-panel-action" id="activityBtnViewAll">View All ↗</button>
                </div>
                <div class="activity-timeline" id="recentActivityList"></div>
              </div>
            </div>
          </div>
        </div>
      </section>`;

html = html.substring(0, homeSectionStart) + updatedHomeHTML + html.substring(homeSectionEnd + 10);
console.log('Updated #sectionHome HTML with Continue Working & Workspace Snapshot');

// D. Add Functional Modals to #nrgOverlayLayer
const overlayStart = html.indexOf('<div id="nrgOverlayLayer" class="nrg-overlay-layer">');
if (overlayStart === -1) throw new Error('Could not find nrgOverlayLayer');

const modalsHTML = `
    <!-- 1. My Account Profile Modal -->
    <div class="modal-overlay" id="modalAccountProfile">
      <div class="modal-dialog" style="max-width:440px;">
        <div class="modal-header">
          <h3 class="modal-title">Developer Account Profile</h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnCloseAccountModal">✕</button>
        </div>
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; align-items:center; gap:14px; background:var(--dropdown-header-bg); padding:12px; border-radius:12px;">
            <div style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, #0066ff, #00d2ff); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800;">TV</div>
            <div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main);">Tanmay Verma</div>
              <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <span>Developer</span>
                <span style="background:rgba(0,102,255,0.15); color:var(--primary-blue); font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px;">PRO ACTIVE</span>
              </div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div class="snapshot-item" style="padding:10px;">
              <span class="snapshot-label">Tier / License</span>
              <span class="snapshot-val" style="color:var(--primary-blue);">Developer Pro</span>
            </div>
            <div class="snapshot-item" style="padding:10px;">
              <span class="snapshot-label">Compilers Active</span>
              <span class="snapshot-val">10 Online (GCC, Clang, JDK...)</span>
            </div>
            <div class="snapshot-item" style="padding:10px;">
              <span class="snapshot-label">Workspace State</span>
              <span class="snapshot-val">Cloud-Native Persistent</span>
            </div>
            <div class="snapshot-item" style="padding:10px;">
              <span class="snapshot-label">Environment</span>
              <span class="snapshot-val">Local Station Verified</span>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px;">
            <button class="glass-btn glass-btn-primary" id="btnDoneAccountModal" style="padding:6px 18px;">Done</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Keyboard Shortcuts Modal -->
    <div class="modal-overlay" id="modalKeyboardShortcuts">
      <div class="modal-dialog" style="max-width:580px;">
        <div class="modal-header">
          <h3 class="modal-title">Keyboard Shortcuts</h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnCloseShortcutsModal">✕</button>
        </div>
        <div style="padding:14px 20px; max-height:480px; overflow-y:auto;">
          <h4 style="font-size:12px; font-weight:700; color:var(--primary-blue); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Editor & Execution</h4>
          <table>
            <thead><tr><th>Action</th><th style="text-align:right;">Shortcut</th></tr></thead>
            <tbody>
              <tr><td>Run Active Code / Compile</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">Enter</span></td></tr>
              <tr><td>Save Active File</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">S</span></td></tr>
              <tr><td>Save As...</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">Shift</span> + <span class="kbd-chip">S</span></td></tr>
              <tr><td>Format Source Code</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">Shift</span> + <span class="kbd-chip">F</span></td></tr>
              <tr><td>Reset to Language Template</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">R</span></td></tr>
            </tbody>
          </table>

          <h4 style="font-size:12px; font-weight:700; color:var(--primary-blue); text-transform:uppercase; letter-spacing:0.5px; margin:16px 0 4px;">Navigation & Overlays</h4>
          <table>
            <thead><tr><th>Action</th><th style="text-align:right;">Shortcut</th></tr></thead>
            <tbody>
              <tr><td>Global Search (Projects & Snippets)</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">K</span></td></tr>
              <tr><td>Dismiss Overlays / Dropdowns / Modals</td><td style="text-align:right;"><span class="kbd-chip">Esc</span></td></tr>
              <tr><td>Toggle Sidebar Panel</td><td style="text-align:right;"><span class="kbd-chip">Ctrl</span> + <span class="kbd-chip">B</span></td></tr>
            </tbody>
          </table>
          <div style="display:flex; justify-content:flex-end; margin-top:14px;">
            <button class="glass-btn glass-btn-primary" id="btnDoneShortcutsModal" style="padding:6px 18px;">Got It</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Help & Support Modal -->
    <div class="modal-overlay" id="modalHelpSupport">
      <div class="modal-dialog" style="max-width:540px;">
        <div class="modal-header">
          <h3 class="modal-title">Help & Developer Support</h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnCloseHelpModal">✕</button>
        </div>
        <div style="padding:16px 20px; display:flex; flex-direction:column; gap:12px;">
          <div>
            <h4 style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:3px;">Polyglot Compiler Engines</h4>
            <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">NRG Engine integrates 10 compilers: C (GCC 13), C++ (Clang), Python 3.12, Rust, Go, Java 21, JavaScript (Node/Browser), TypeScript, C#, and PHP. All compilation runs through sandboxed Judge0 CE architecture.</p>
          </div>
          <div>
            <h4 style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:3px;">Universal Graphics Workspace</h4>
            <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">Access vector turtle drawings, Python Matplotlib plots, and Java AWT graphics via the Graphics tab in the terminal docking panel.</p>
          </div>
          <div>
            <h4 style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:3px;">Execution Diagnostics</h4>
            <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">Compiler errors, warnings, and memory stack traces are highlighted in real-time in the Problems and Terminal docks.</p>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px;">
            <button class="glass-btn glass-btn-primary" id="btnDoneHelpModal" style="padding:6px 18px;">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Sign Out Confirmation Modal -->
    <div class="modal-overlay" id="modalSignOutConfirm">
      <div class="modal-dialog" style="max-width:400px;">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Sign Out</h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnCloseSignOutModal">✕</button>
        </div>
        <div style="padding:16px 20px;">
          <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.45; margin-bottom:16px;">
            Are you sure you want to sign out of <b>Tanmay Verma (Developer Edition)</b>? Your local project files, saved snippets, and editor history are securely saved.
          </p>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="glass-btn" id="btnCancelSignOutModal" style="padding:6px 14px;">Cancel</button>
            <button class="glass-btn" id="btnConfirmSignOut" style="padding:6px 16px; background:#ef4444; color:#fff; border-color:#dc2626;">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
`;

// Insert modals right before the closing tag of nrgOverlayLayer
const overlayCloseIdx = html.indexOf('</div>\n  <!-- ====================================================================', overlayStart);
const safeOverlayClose = overlayCloseIdx !== -1 ? overlayCloseIdx : html.indexOf('</div>\n  <script>');

html = html.substring(0, safeOverlayClose) + modalsHTML + '\n  ' + html.substring(safeOverlayClose);
console.log('Injected functional modals into #nrgOverlayLayer');

// E. JS: Centralized Workspace Activity Engine & Dropdown Actions
const jsActivityEngine = `
    // ==========================================================================
    // CENTRALIZED WORKSPACE ACTIVITY & PERSISTENCE ENGINE (Part 3 & Part 5)
    // ==========================================================================
    let workspaceState = JSON.parse(localStorage.getItem('nrg_workspace_state') || 'null') || {
      activeProjectId: 'p1',
      activeProjectName: 'nrg-kernel-c',
      activeFileName: 'main.c',
      activeLang: 'c',
      lastModifiedTime: Date.now() - 7200000,
      lastOpenedTime: Date.now()
    };

    function saveWorkspaceState() {
      localStorage.setItem('nrg_workspace_state', JSON.stringify(workspaceState));
    }

    function formatRelativeTime(ts) {
      if (!ts) return 'Just now';
      if (typeof ts === 'string' && isNaN(Date.parse(ts))) {
        return ts;
      }
      const date = typeof ts === 'number' ? new Date(ts) : new Date(Date.parse(ts));
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return \`\${diffMin} \${diffMin === 1 ? 'minute' : 'minutes'} ago\`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return \`\${diffHours} \${diffHours === 1 ? 'hour' : 'hours'} ago\`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return \`\${diffDays} days ago\`;
      return date.toLocaleDateString();
    }

    function trackWorkspaceActivity(type, text) {
      let acts = JSON.parse(localStorage.getItem('nrg_recent_activities') || 'null') || [
        { dotClass: '', icon: '✏️', text: 'Edited main.c in nrg-kernel-c', time: '2 hours ago' },
        { dotClass: 'dot-green', icon: '▶', text: 'Executed python-algo-ml', time: 'Yesterday' },
        { dotClass: 'dot-cyan', icon: '+', text: 'Created project rust-crypto-cli', time: '3 days ago' },
        { dotClass: '', icon: '📁', text: 'Opened Graphics Workspace', time: '3 days ago' }
      ];

      let icon = '✏️';
      let dotClass = '';
      if (type === 'run') { icon = '▶'; dotClass = 'dot-green'; }
      else if (type === 'create') { icon = '+'; dotClass = 'dot-cyan'; }
      else if (type === 'error') { icon = '✕'; dotClass = 'dot-red'; }
      else if (type === 'open') { icon = '📁'; dotClass = ''; }
      else if (type === 'save') { icon = '💾'; dotClass = 'dot-green'; }

      // Avoid immediate duplicate consecutive entries
      if (acts.length > 0 && acts[0].text === text) {
        acts[0].time = 'Just now';
      } else {
        acts.unshift({ dotClass, icon, text, time: 'Just now', timestamp: Date.now() });
        if (acts.length > 15) acts = acts.slice(0, 15);
      }
      localStorage.setItem('nrg_recent_activities', JSON.stringify(acts));

      // Refresh Home Dashboard if active
      if (document.getElementById('sectionHome')?.classList.contains('active')) {
        renderHomeSection();
      }
    }

    function updateProjectModified(projId, customTime = Date.now()) {
      const proj = projectsData.find(p => p.id === projId);
      if (!proj) return;
      proj.lastModified = customTime;
      proj.updated = formatRelativeTime(customTime);
      localStorage.setItem('nrg_projects', JSON.stringify(projectsData));
      
      workspaceState.lastModifiedTime = customTime;
      saveWorkspaceState();

      if (document.getElementById('sectionHome')?.classList.contains('active')) {
        renderHomeSection();
      }
    }

    // Git branch probe
    let cachedGitBranch = 'main';
    fetch('/api/git-branch')
      .then(r => r.json())
      .then(d => {
        if (d && d.available && d.branch) {
          cachedGitBranch = d.branch;
          const el = document.getElementById('snapGitBranch');
          if (el) el.innerHTML = \`<span class="snap-dot blue"></span> \${cachedGitBranch}\`;
        }
      })
      .catch(() => {});
`;

// Insert the activity engine right before function renderHomeSection()
const renderHomeIdx = html.indexOf('function renderHomeSection() {');
html = html.substring(0, renderHomeIdx) + jsActivityEngine + '\n    ' + html.substring(renderHomeIdx);
console.log('Injected workspace activity engine');

// F. Update renderHomeSection() to populate 2 stats, Continue Working, Workspace Snapshot, Recent Projects, Quick Files, and Timeline
const renderHomeStart = html.indexOf('function renderHomeSection() {');
const renderHomeEnd = html.indexOf('// Quick Launch Shortcuts Handlers', renderHomeStart);

const updatedRenderHomeJS = `function renderHomeSection() {
      // 1. Two Balanced Statistics (Part 2: Last Activity Removed)
      const pCountEl = document.getElementById('homeStatProjectsCount');
      if (pCountEl) pCountEl.textContent = projectsData.length;

      const sCountEl = document.getElementById('homeStatSnippetsCount');
      if (sCountEl) sCountEl.textContent = snippetsData.length;

      // 2. Continue Working Panel (Part 5A)
      const activeProj = projectsData.find(p => p.id === workspaceState.activeProjectId) || projectsData[0];
      const cwProjNameEl = document.getElementById('cwProjName');
      if (cwProjNameEl && activeProj) cwProjNameEl.textContent = activeProj.name;

      const cwLangTagEl = document.getElementById('cwLangTag');
      if (cwLangTagEl && activeProj) cwLangTagEl.textContent = (LANGUAGES[activeProj.lang]?.name || 'C').split(' ')[0];

      const cwFileNameEl = document.getElementById('cwFileName');
      if (cwFileNameEl && activeProj) cwFileNameEl.textContent = workspaceState.activeFileName || activeProj.file || 'main.c';

      const cwLastTimeEl = document.getElementById('cwLastTime');
      if (cwLastTimeEl) {
        cwLastTimeEl.textContent = \`Modified \${formatRelativeTime(workspaceState.lastModifiedTime)}\`;
      }

      // 3. Workspace Snapshot Panel (Part 5B)
      const snapProjEl = document.getElementById('snapActiveProj');
      if (snapProjEl && activeProj) snapProjEl.textContent = activeProj.name;

      const snapFileEl = document.getElementById('snapActiveFile');
      if (snapFileEl && activeProj) {
        const langName = (LANGUAGES[workspaceState.activeLang || activeProj.lang]?.name || 'C').split(' ')[0];
        snapFileEl.textContent = \`\${workspaceState.activeFileName || activeProj.file} (\${langName})\`;
      }

      const snapExecEl = document.getElementById('snapLastExec');
      if (snapExecEl) {
        const lastExec = JSON.parse(localStorage.getItem('nrg_last_exec') || 'null');
        if (lastExec) {
          if (lastExec.status === 'Accepted') {
            snapExecEl.innerHTML = \`<span class="snap-dot green"></span> Accepted (\${lastExec.time || '0.04s'})\`;
          } else {
            snapExecEl.innerHTML = \`<span class="snap-dot red"></span> \${lastExec.status || 'Failed'}\`;
          }
        } else {
          snapExecEl.innerHTML = \`<span class="snap-dot green"></span> Ready\`;
        }
      }

      const snapBranchEl = document.getElementById('snapGitBranch');
      if (snapBranchEl) {
        snapBranchEl.innerHTML = \`<span class="snap-dot blue"></span> \${cachedGitBranch}\`;
      }

      // 4. Recent Projects List (Part 3: Real-Time Dynamic Timestamps)
      const recentList = document.getElementById('homeRecentProjectsList');
      if (recentList) {
        recentList.innerHTML = projectsData.slice(0, 3).map(p => {
          const langInfo = LANGUAGES[p.lang] || { badge: 'C', badgeBg: '#0066ff', name: 'C' };
          let avatarContent = \`<span style="font-size:12px; font-weight:800;">\${langInfo.badge}</span>\`;
          if (p.lang === 'python') avatarContent = \`<span style="font-size:13px;">🐍</span>\`;
          else if (p.lang === 'rust') avatarContent = \`<span style="font-size:12px;">⚙️</span>\`;
          
          const relativeTime = formatRelativeTime(p.lastModified || p.updated);
          return \`
            <div class="recent-proj-row" onclick="openProjectInEditor('\${p.id}')">
              <div class="recent-proj-left">
                <div class="recent-proj-avatar" style="background:\${langInfo.badgeBg || '#0066ff'};">
                  \${avatarContent}
                </div>
                <div class="recent-proj-info">
                  <div class="recent-proj-name-wrap">
                    <span class="recent-proj-name">\${p.name}</span>
                    <span class="recent-proj-tag">\${langInfo.name.split(' ')[0]}</span>
                  </div>
                  <div class="recent-proj-meta">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span>\${p.file} • \${p.filesCount || 1} files in workspace</span>
                  </div>
                </div>
              </div>
              <div class="recent-proj-right">
                <div class="recent-proj-time">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>Modified \${relativeTime}</span>
                </div>
                <button class="recent-proj-btn" onclick="event.stopPropagation(); openProjectInEditor('\${p.id}');">Open Editor →</button>
              </div>
            </div>
          \`;
        }).join('');
      }

      // 5. Quick Files Chips
      const quickRow = document.getElementById('homeQuickFilesRow');
      if (quickRow) {
        quickRow.innerHTML = [
          { file: 'main.c', lang: 'c' },
          { file: 'main.py', lang: 'python' },
          { file: 'main.rs', lang: 'rust' },
          { file: 'script.js', lang: 'javascript' },
          { file: 'Main.java', lang: 'java' }
        ].map(f => \`
          <div class="quick-file-chip" onclick="switchLanguage('\${f.lang}'); workspaceState.activeFileName = '\${f.file}'; workspaceState.activeLang = '\${f.lang}'; saveWorkspaceState(); trackWorkspaceActivity('open', 'Opened \${f.file}'); navigateToSection('editor');">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>\${f.file}</span>
          </div>
        \`).join('');
      }

      // 6. Recent Activity Timeline
      const actList = document.getElementById('recentActivityList');
      if (actList) {
        let acts = JSON.parse(localStorage.getItem('nrg_recent_activities') || 'null');
        if (!acts || acts.length === 0) {
          acts = [
            { dotClass: '', icon: '✏️', text: 'Edited main.c in nrg-kernel-c', time: '2 hours ago' },
            { dotClass: 'dot-green', icon: '▶', text: 'Executed python-algo-ml', time: 'Yesterday' },
            { dotClass: 'dot-cyan', icon: '+', text: 'Created project rust-crypto-cli', time: '3 days ago' },
            { dotClass: '', icon: '📁', text: 'Opened Graphics Workspace', time: '3 days ago' }
          ];
        }
        actList.innerHTML = acts.map(a => \`
          <div class="activity-item">
            <div class="activity-dot \${a.dotClass || ''}">\${a.icon}</div>
            <div class="activity-text" title="\${a.text}">\${a.text}</div>
            <div class="activity-time">\${a.timestamp ? formatRelativeTime(a.timestamp) : a.time}</div>
          </div>
        \`).join('');
      }
    }

    document.getElementById('homeBtnGoEditor')?.addEventListener('click', () => navigateToSection('editor'));
    document.getElementById('homeBtnNewProj')?.addEventListener('click', () => openProjectModal());
    document.getElementById('homeBtnViewAllProjects')?.addEventListener('click', () => navigateToSection('projects'));
    document.getElementById('cwActionBtn')?.addEventListener('click', () => {
      if (workspaceState.activeProjectId) {
        openProjectInEditor(workspaceState.activeProjectId);
      } else {
        navigateToSection('editor');
      }
    });
`;

html = html.substring(0, renderHomeStart) + updatedRenderHomeJS + '\n    ' + html.substring(renderHomeEnd);
console.log('Updated renderHomeSection() implementation');

// G. Wire up Save & Autosave & Execution in Editor
// Replace saveActiveFile
const saveActiveStart = html.indexOf('function saveActiveFile() {');
const saveActiveEnd = html.indexOf('function saveAsFile() {', saveActiveStart);

const enhancedSaveActive = `function saveActiveFile() {
      const activeFile = getActiveFile();
      activeFile.code = codeInput.value;
      activeFile.isDirty = false;
      renderFileTabs();

      const projId = workspaceState.activeProjectId || 'p1';
      updateProjectModified(projId, Date.now());
      trackWorkspaceActivity('save', \`Saved \${activeFile.name} in \${workspaceState.activeProjectName || 'nrg-kernel-c'}\`);
      showToast(\`Saved \${activeFile.name}\`);
    }

    // Debounced Autosave (Part 3)
    let autoSaveTimer = null;
    codeInput.addEventListener('input', () => {
      const activeFile = getActiveFile();
      if (activeFile) {
        activeFile.isDirty = true;
        renderFileTabs();
      }
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        if (activeFile && activeFile.isDirty) {
          saveActiveFile();
        }
      }, 2500);
    });
`;

html = html.substring(0, saveActiveStart) + enhancedSaveActive + '\n    ' + html.substring(saveActiveEnd);

// In openProjectInEditor, track project opening
const openProjStart = html.indexOf('function openProjectInEditor(projId) {');
const openProjEnd = html.indexOf('function renameProject(projId) {', openProjStart);

const enhancedOpenProj = `function openProjectInEditor(projId) {
      const proj = projectsData.find(p => p.id === projId);
      if (!proj) return;
      
      workspaceState.activeProjectId = proj.id;
      workspaceState.activeProjectName = proj.name;
      workspaceState.activeFileName = proj.file;
      workspaceState.activeLang = proj.lang;
      workspaceState.lastOpenedTime = Date.now();
      saveWorkspaceState();

      trackWorkspaceActivity('open', \`Opened project \${proj.name}\`);

      switchLanguage(proj.lang);
      if (proj.code) {
        currentCode = proj.code;
        codeInput.value = currentCode;
        updateEditorDisplay();
      }
      navigateToSection('editor');
      showToast(\`Loaded project "\${proj.name}"\`);
    }
`;

html = html.substring(0, openProjStart) + enhancedOpenProj + '\n    ' + html.substring(openProjEnd);

// In executeRealCode, record execution result
const execCallIdx = html.indexOf('// Record in Run History\n      recordRunHistory(data);');
if (execCallIdx !== -1) {
  const execHook = `// Record in Run History
      recordRunHistory(data);
      const isAccepted = data.status && data.status.id === 3;
      localStorage.setItem('nrg_last_exec', JSON.stringify({
        status: isAccepted ? 'Accepted' : 'Failed',
        time: data.time ? \`\${data.time}s\` : '0.04s',
        memory: data.memory ? \`\${Math.round(data.memory / 1024)}MB\` : '12MB',
        timestamp: Date.now()
      }));
      trackWorkspaceActivity(isAccepted ? 'run' : 'error', isAccepted ? \`Executed \${LANGUAGES[currentLang]?.file || 'code'} (Accepted)\` : \`Execution error in \${LANGUAGES[currentLang]?.file || 'code'}\`);
`;
  html = html.substring(0, execCallIdx) + execHook + html.substring(execCallIdx + 56);
  console.log('Hooked executeRealCode for real-time tracking');
}

// H. Universal Theme Switcher & Modal Handlers
const dropdownHandlersStart = html.indexOf('// User Profile & Notification Dropdown Handlers (Overlay Portal Positioning)');
const dropdownHandlersEnd = html.indexOf('document.getElementById(\'btnMessages\')', dropdownHandlersStart);

const updatedDropdownHandlers = `// User Profile & Notification Dropdown Handlers & Theme Consistency (Part 1 & Part 4)
    function toggleAppTheme() {
      const isDark = document.body.classList.contains('theme-dark');
      document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-light');
      if (!isDark) {
        document.body.classList.add('theme-dark');
        localStorage.setItem('nrg_theme', 'dark');
        showToast('Switched to Cyber Obsidian Dark');
      } else {
        document.body.classList.add('theme-light');
        localStorage.setItem('nrg_theme', 'light');
        showToast('Switched to Light Frosted Glass');
      }
    }

    // Initialize persisted theme
    const savedAppTheme = localStorage.getItem('nrg_theme') || 'dark';
    document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-light');
    if (savedAppTheme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.add('theme-dark');
    }

    // Top Header Theme Button
    document.getElementById('btnThemeToggle')?.addEventListener('click', toggleAppTheme);

    function positionProfileDropdown() {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      if (!profileDropdown || !userProfileBtn) return;

      const rect = userProfileBtn.getBoundingClientRect();
      const menuWidth = 250;
      const padding = 12;

      let top = rect.bottom + 8;
      let left = rect.right - menuWidth;

      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      const menuHeight = profileDropdown.offsetHeight || 310;
      if (top + menuHeight > window.innerHeight - padding) {
        const topAbove = rect.top - menuHeight - 8;
        if (topAbove >= padding) {
          top = topAbove;
        } else {
          top = Math.max(padding, window.innerHeight - menuHeight - padding);
        }
      }

      profileDropdown.style.top = Math.round(top) + 'px';
      profileDropdown.style.left = Math.round(left) + 'px';
    }

    function positionNotificationsDropdown() {
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');
      if (!notificationsDropdown || !btnNotifications) return;

      const rect = btnNotifications.getBoundingClientRect();
      const menuWidth = 320;
      const padding = 12;

      let top = rect.bottom + 8;
      let left = rect.right - menuWidth;

      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      const menuHeight = notificationsDropdown.offsetHeight || 380;
      if (top + menuHeight > window.innerHeight - padding) {
        const topAbove = rect.top - menuHeight - 8;
        if (topAbove >= padding) {
          top = topAbove;
        } else {
          top = Math.max(padding, window.innerHeight - menuHeight - padding);
        }
      }

      notificationsDropdown.style.top = Math.round(top) + 'px';
      notificationsDropdown.style.left = Math.round(left) + 'px';
    }

    function closeAllHeaderDropdowns() {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');

      if (profileDropdown) {
        profileDropdown.classList.remove('open');
        userProfileBtn?.setAttribute('aria-expanded', 'false');
        userProfileBtn?.classList.remove('open');
      }
      if (notificationsDropdown) {
        notificationsDropdown.classList.remove('open');
        btnNotifications?.setAttribute('aria-expanded', 'false');
      }
    }

    const userProfileBtnEl = document.getElementById('userProfileBtn');
    if (userProfileBtnEl) {
      userProfileBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const profileDropdown = document.getElementById('profileDropdownMenu');
        const isOpen = profileDropdown && profileDropdown.classList.contains('open');
        closeAllHeaderDropdowns();
        if (!isOpen && profileDropdown) {
          positionProfileDropdown();
          profileDropdown.classList.add('open');
          userProfileBtnEl.setAttribute('aria-expanded', 'true');
          userProfileBtnEl.classList.add('open');
        }
      });
    }

    document.getElementById('profileDropdownMenu')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const btnNotificationsEl = document.getElementById('btnNotifications');
    if (btnNotificationsEl) {
      btnNotificationsEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
        const isOpen = notificationsDropdown && notificationsDropdown.classList.contains('open');
        closeAllHeaderDropdowns();
        if (!isOpen && notificationsDropdown) {
          positionNotificationsDropdown();
          notificationsDropdown.classList.add('open');
          btnNotificationsEl.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.getElementById('notificationsDropdownMenu')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    window.addEventListener('resize', () => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      if (profileDropdown?.classList.contains('open')) positionProfileDropdown();
      if (notificationsDropdown?.classList.contains('open')) positionNotificationsDropdown();
    });
    window.addEventListener('scroll', () => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      if (profileDropdown?.classList.contains('open')) positionProfileDropdown();
      if (notificationsDropdown?.classList.contains('open')) positionNotificationsDropdown();
    }, true);

    // Profile Dropdown Functional Handlers (Part 4)
    // 1. My Account Modal
    const modalAccount = document.getElementById('modalAccountProfile');
    document.getElementById('pmenuAccount')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalAccount?.classList.add('open');
    });
    document.getElementById('btnCloseAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));
    document.getElementById('btnDoneAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));

    // 2. Preferences
    document.getElementById('pmenuPreferences')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      navigateToSection('settings');
    });

    // 3. Theme Toggle (Instant & Synchronous)
    document.getElementById('pmenuTheme')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAppTheme();
    });

    // 4. Keyboard Shortcuts Modal
    const modalShortcuts = document.getElementById('modalKeyboardShortcuts');
    document.getElementById('pmenuShortcuts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalShortcuts?.classList.add('open');
    });
    document.getElementById('btnCloseShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));
    document.getElementById('btnDoneShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));

    // 5. Help & Support Modal
    const modalHelp = document.getElementById('modalHelpSupport');
    document.getElementById('pmenuHelp')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalHelp?.classList.add('open');
    });
    document.getElementById('btnCloseHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));
    document.getElementById('btnDoneHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));

    // 6. Sign Out Modal
    const modalSignOut = document.getElementById('modalSignOutConfirm');
    document.getElementById('pmenuSignOut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalSignOut?.classList.add('open');
    });
    document.getElementById('btnCloseSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnCancelSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnConfirmSignOut')?.addEventListener('click', () => {
      modalSignOut?.classList.remove('open');
      showToast('Signed out of Developer session');
    });

    // Close all modals on backdrop click
    [modalAccount, modalShortcuts, modalHelp, modalSignOut].forEach(m => {
      m?.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('open');
      });
    });

    // Notifications Dropdown Actions
    document.getElementById('btnMarkAllRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('#notificationsList .notification-item').forEach(item => {
        item.classList.remove('unread');
      });
      const unreadDot = document.getElementById('notificationsBadgeDot');
      const unreadPill = document.getElementById('unreadCountPill');
      if (unreadDot) unreadDot.style.display = 'none';
      if (unreadPill) unreadPill.textContent = '0 new';
      showToast('All notifications marked as read');
    });

    document.querySelectorAll('#notificationsList .notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.remove('unread');
        const unreadPill = document.getElementById('unreadCountPill');
        const unreadDot = document.getElementById('notificationsBadgeDot');
        const remainingUnread = document.querySelectorAll('#notificationsList .notification-item.unread').length;
        if (unreadPill) unreadPill.textContent = \`\${remainingUnread} new\`;
        if (remainingUnread === 0 && unreadDot) unreadDot.style.display = 'none';

        const action = item.dataset.action;
        closeAllHeaderDropdowns();
        if (action === 'editor') navigateToSection('editor');
        else if (action === 'projects') navigateToSection('projects');
        else if (action === 'templates') navigateToSection('templates');
        else if (action === 'graphics') {
          navigateToSection('editor');
          switchTerminalTab('graphics');
        }
      });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      const profileDropdown = document.getElementById('profileDropdownMenu');
      const userProfileBtn = document.getElementById('userProfileBtn');
      const notificationsDropdown = document.getElementById('notificationsDropdownMenu');
      const btnNotifications = document.getElementById('btnNotifications');

      if (profileDropdown && !profileDropdown.contains(e.target) && !userProfileBtn?.contains(e.target)) {
        profileDropdown.classList.remove('open');
        userProfileBtn?.classList.remove('open');
        userProfileBtn?.setAttribute('aria-expanded', 'false');
      }
      if (notificationsDropdown && !notificationsDropdown.contains(e.target) && !btnNotifications?.contains(e.target)) {
        notificationsDropdown.classList.remove('open');
        btnNotifications?.setAttribute('aria-expanded', 'false');
      }
    });

    // Escape closes dropdowns and modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllHeaderDropdowns();
        [modalAccount, modalShortcuts, modalHelp, modalSignOut, modalProject].forEach(m => m?.classList.remove('open'));
      }
    });
`;

html = html.substring(0, dropdownHandlersStart) + updatedDropdownHandlers + '\n    ' + html.substring(dropdownHandlersEnd);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully applied Home Dashboard intelligence upgrade! New length:', html.length);
