// Script to apply Workspace & Rendering Upgrade to C:\Users\tanma\nrg-engine\index.html
const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/tanma/nrg-engine/index.html';
const backupPath = 'C:/Users/tanma/nrg-engine/index.html.bak';

let html = fs.readFileSync(filePath, 'utf8');

// Create backup
fs.writeFileSync(backupPath, html, 'utf8');
console.log('Created backup at', backupPath);

// =========================================================================
// 1. CSS UPGRADES
// =========================================================================
const cssAdditions = `
    /* ==========================================================================
       DEVELOPER SIGNATURE & WORKSPACE UPGRADES
       ========================================================================== */

    /* Developer Signature Card (Sidebar) */
    .developer-signature-card {
      margin-top: auto;
      margin-bottom: 8px;
      padding: 10px 12px;
      background: var(--card-bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-panel-border);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 3px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .developer-signature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2.5px;
      background: linear-gradient(90deg, #38bdf8, #2563eb, #6366f1);
      opacity: 0.9;
    }
    .developer-signature-card:hover {
      border-color: rgba(37, 99, 235, 0.4);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.15);
      transform: translateY(-1px);
    }
    .dev-sig-header {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dev-sig-sparkle {
      color: #38bdf8;
      font-size: 11px;
      display: inline-block;
      animation: sigSparkle 2s ease-in-out infinite alternate;
    }
    @keyframes sigSparkle {
      0% { transform: scale(0.9) rotate(0deg); opacity: 0.75; }
      100% { transform: scale(1.2) rotate(15deg); opacity: 1; filter: drop-shadow(0 0 4px #38bdf8); }
    }
    .dev-sig-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .dev-sig-name {
      font-family: 'Playfair Display', 'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, serif;
      font-size: 15.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.25;
      background: linear-gradient(135deg, var(--text-main) 60%, var(--primary-blue));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .dev-sig-badge {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.9px;
      text-transform: uppercase;
      color: var(--primary-blue);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
      opacity: 0.95;
    }

    /* Workspace Resizer Divider */
    .workspace-resizer {
      height: 10px;
      margin: 1px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: row-resize;
      position: relative;
      z-index: 25;
      user-select: none;
      -webkit-user-select: none;
      flex-shrink: 0;
      transition: background 0.18s ease;
    }
    .workspace-resizer:hover, .workspace-resizer.is-dragging {
      background: rgba(14, 165, 233, 0.14);
      border-radius: 4px;
    }
    .resizer-handle-pill {
      width: 44px;
      height: 4px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.4);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .workspace-resizer:hover .resizer-handle-pill,
    .workspace-resizer.is-dragging .resizer-handle-pill {
      width: 68px;
      height: 5px;
      background: var(--primary-blue);
      box-shadow: 0 0 10px rgba(14, 165, 233, 0.6);
    }
    body.resizing-vertical {
      cursor: row-resize !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    body.resizing-vertical * {
      user-select: none !important;
      -webkit-user-select: none !important;
      pointer-events: none !important;
    }
    body.resizing-vertical .workspace-resizer {
      pointer-events: auto !important;
    }

    /* Layout States: Maximized / Collapsed */
    .center-col.editor-maximized .editor-card {
      flex: 1 1 100% !important;
      height: 100% !important;
      max-height: 100% !important;
    }
    .center-col.editor-maximized .workspace-resizer,
    .center-col.editor-maximized .terminal-card {
      display: none !important;
    }

    .center-col.terminal-maximized .terminal-card {
      flex: 1 1 100% !important;
      height: 100% !important;
      max-height: 100% !important;
    }
    .center-col.terminal-maximized .workspace-resizer,
    .center-col.terminal-maximized .editor-card {
      display: none !important;
    }

    .center-col.terminal-collapsed .terminal-card {
      flex: 0 0 38px !important;
      height: 38px !important;
      min-height: 38px !important;
      max-height: 38px !important;
    }
    .center-col.terminal-collapsed .terminal-card .terminal-body {
      display: none !important;
    }
    .center-col.terminal-collapsed .editor-card {
      flex: 1 !important;
    }

    /* Right panel toggle support */
    .app-main.right-panel-hidden .right-col {
      display: none !important;
    }
    .app-main.right-panel-hidden {
      grid-template-columns: 200px 1fr !important;
    }

    /* Three-Dot Workspace Dropdown Menu */
    .editor-menu-wrapper {
      position: relative;
      display: inline-flex;
    }
    .workspace-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 275px;
      background: var(--card-bg-glass);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-panel-border);
      border-radius: var(--radius-md);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18), 0 3px 8px rgba(0, 0, 0, 0.1);
      padding: 6px;
      z-index: 250;
      display: none;
      flex-direction: column;
      gap: 2px;
      max-height: 82vh;
      overflow-y: auto;
      animation: menuFadeIn 0.15s ease-out;
    }
    @keyframes menuFadeIn {
      from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .workspace-dropdown-menu.active {
      display: flex;
    }
    .menu-section-header {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: var(--text-muted);
      padding: 6px 8px 3px;
    }
    .menu-item-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 6px 8px;
      border-radius: 6px;
      border: 0;
      background: transparent;
      color: var(--text-main);
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }
    .menu-item-btn:hover {
      background: var(--card-bg-subtle);
      color: var(--primary-blue);
    }
    .menu-item-btn .item-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .menu-item-shortcut {
      font-size: 10px;
      color: var(--text-muted);
      font-family: inherit;
      background: rgba(148, 163, 184, 0.12);
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .menu-divider {
      height: 1px;
      background: var(--glass-panel-border);
      margin: 4px 0;
    }

    /* Floating Find & Replace Bar */
    .editor-find-replace-bar {
      position: absolute;
      top: 48px;
      right: 18px;
      z-index: 120;
      background: var(--card-bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--glass-panel-border);
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 330px;
      animation: menuFadeIn 0.15s ease-out;
    }
    .find-row, .replace-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .find-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--input-bg);
      border: 1px solid var(--glass-panel-border);
      border-radius: 6px;
      padding: 4px 8px;
    }
    .find-input-wrap input {
      flex: 1;
      border: 0;
      background: transparent;
      outline: none;
      font-size: 12px;
      color: var(--text-main);
      font-family: inherit;
    }
    .find-count-badge {
      font-size: 11px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .find-tool-btn, .find-action-btn, .find-close-btn {
      border: 1px solid var(--glass-panel-border);
      background: var(--card-bg-subtle);
      color: var(--text-secondary);
      border-radius: 5px;
      padding: 4px 7px;
      font-size: 11.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .find-tool-btn:hover, .find-action-btn:hover {
      background: var(--primary-blue);
      color: #fff;
      border-color: var(--primary-blue);
    }
    .find-tool-btn.active {
      background: var(--primary-blue);
      color: #fff;
    }
    .find-close-btn:hover {
      background: #ef4444;
      color: #fff;
      border-color: #ef4444;
    }
    .find-action-btn {
      font-weight: 600;
      padding: 4px 10px;
    }

    /* Word Wrap toggle support */
    .editor-body-wrap.word-wrap .editor-code-input,
    .editor-body-wrap.word-wrap .editor-content-area {
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-x: hidden !important;
    }

    /* Tab Dirty / Unsaved indicator */
    .tab-dirty-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary-blue);
      margin-left: 2px;
    }

    /* History tab styles */
    .history-card-item {
      padding: 8px 12px;
      border: 1px solid var(--glass-panel-border);
      border-radius: 8px;
      margin-bottom: 6px;
      background: var(--card-bg-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .history-card-item:hover {
      border-color: var(--primary-blue);
      transform: translateX(2px);
    }
    .history-card-item.status-success { border-left: 3px solid #16a34a; }
    .history-card-item.status-error { border-left: 3px solid #ef4444; }
    .history-card-item.status-timeout { border-left: 3px solid #f59e0b; }
`;

// Insert CSS right before </style>
html = html.replace('</style>', cssAdditions + '\n  </style>');

// Fix .term-output-text in CSS to strictly pre-wrap and monospace
html = html.replace(
`.term-output-text {
      margin: 6px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-main);
    }`,
`.term-output-text {
      margin: 6px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      font-family: "JetBrains Mono", "Consolas", var(--font-mono), monospace !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      tab-size: 4 !important;
      line-height: 1.6 !important;
    }`
);

// Ensure .term-log-stream is also pre-wrap
html = html.replace(
`.term-log-stream {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }`,
`.term-log-stream {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-family: "JetBrains Mono", "Consolas", var(--font-mono), monospace !important;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      tab-size: 4 !important;
      flex: 1;
    }`
);

// Add Developer Signature Card above sidebar footer
const devSigMarkup = `
        <!-- Developer Signature Card (Requirement 4) -->
        <div class="developer-signature-card">
          <div class="dev-sig-header">
            <span class="dev-sig-sparkle">✦</span>
            <span class="dev-sig-label">CREATOR</span>
          </div>
          <div class="dev-sig-name">Developed by Tanmay Verma</div>
          <div class="dev-sig-badge">NRG ENGINE &bull; DEVELOPER EDITION</div>
        </div>
`;
html = html.replace('<!-- Sidebar Footer Version -->', devSigMarkup + '\n        <!-- Sidebar Footer Version -->');

// Wrap btnEditorMore with Three-Dot Menu and add Maximize Editor button
const editorMoreReplacement = `
              <!-- Maximize Editor Button -->
              <button class="btn-editor-action" id="btnEditorMaximize" title="Maximize Editor (Toggle)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>

              <!-- More Options Dropdown Wrapper -->
              <div class="editor-menu-wrapper" id="editorMenuWrapper">
                <button class="btn-editor-action" id="btnEditorMore" title="More Options">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>

                <!-- Floating Workspace Dropdown Menu (Requirement 3) -->
                <div class="workspace-dropdown-menu" id="workspaceDropdownMenu">
                  <div class="menu-section-header">File Operations</div>
                  <button class="menu-item-btn" id="menuNewFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                      <span>New File</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+N</span>
                  </button>
                  <button class="menu-item-btn" id="menuRenameFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      <span>Rename File</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuDuplicateFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      <span>Duplicate File</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuSaveFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
                      <span>Save</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+S</span>
                  </button>
                  <button class="menu-item-btn" id="menuSaveAsFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                      <span>Save As...</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+Shift+S</span>
                  </button>
                  <button class="menu-item-btn" id="menuDownloadFile">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      <span>Download File</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuExportHtml">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      <span>Export as HTML</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuCloseTab">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      <span>Close Tab</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+W</span>
                  </button>

                  <div class="menu-divider"></div>
                  <div class="menu-section-header">Editing Operations</div>
                  <button class="menu-item-btn" id="menuUndo">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                      <span>Undo</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+Z</span>
                  </button>
                  <button class="menu-item-btn" id="menuRedo">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                      <span>Redo</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+Y</span>
                  </button>
                  <button class="menu-item-btn" id="menuFind">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <span>Find</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+F</span>
                  </button>
                  <button class="menu-item-btn" id="menuFindReplace">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                      <span>Find & Replace</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+H</span>
                  </button>
                  <button class="menu-item-btn" id="menuSelectAll">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                      <span>Select All</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+A</span>
                  </button>
                  <button class="menu-item-btn" id="menuCopyAll">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      <span>Copy All Code</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuFormatDoc">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      <span>Format Document</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+Shift+F</span>
                  </button>

                  <div class="menu-divider"></div>
                  <div class="menu-section-header">Editor Settings</div>
                  <button class="menu-item-btn" id="menuToggleWrap">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 10 21 14 17 18"></polyline><path d="M3 6h18"></path><path d="M3 14h15a3 3 0 0 1 0 6H3"></path></svg>
                      <span>Toggle Word Wrap</span>
                    </span>
                    <span class="menu-item-shortcut" id="menuWrapState">Off</span>
                  </button>
                  <button class="menu-item-btn" id="menuFontIncrease">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span>Increase Font Size</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+=</span>
                  </button>
                  <button class="menu-item-btn" id="menuFontDecrease">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span>Decrease Font Size</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+-</span>
                  </button>
                  <button class="menu-item-btn" id="menuFontReset">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                      <span>Reset Font Size</span>
                    </span>
                    <span class="menu-item-shortcut">14px</span>
                  </button>
                  <button class="menu-item-btn" id="menuToggleLineNumbers">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
                      <span>Toggle Line Numbers</span>
                    </span>
                  </button>

                  <div class="menu-divider"></div>
                  <div class="menu-section-header">Workspace & Panels</div>
                  <button class="menu-item-btn" id="menuToggleMaximizeEditor">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                      <span>Maximize Editor</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuToggleTerminal">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                      <span>Toggle Terminal</span>
                    </span>
                    <span class="menu-item-shortcut">Ctrl+\`</span>
                  </button>
                  <button class="menu-item-btn" id="menuToggleRightPanel">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                      <span>Toggle Right Panel</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuResetLayout">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>
                      <span>Reset Layout</span>
                    </span>
                  </button>
                  <button class="menu-item-btn" id="menuRunHistory">
                    <span class="item-left">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>Run History</span>
                    </span>
                  </button>
                </div>
              </div>
`;

html = html.replace(
`<button class="btn-editor-action" id="btnEditorMore" title="More Options">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1.5"></circle>
                  <circle cx="12" cy="5" r="1.5"></circle>
                  <circle cx="12" cy="19" r="1.5"></circle>
                </svg>
              </button>`,
editorMoreReplacement
);

// Insert Floating Find & Replace bar inside .editor-card before .editor-body-wrap
const findReplaceBarHtml = `
          <!-- Floating Find & Replace Bar (Requirement 3 & 5) -->
          <div class="editor-find-replace-bar" id="findReplaceBar" style="display: none;">
            <div class="find-row">
              <div class="find-input-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="findInput" placeholder="Find in document..." autocomplete="off">
                <span class="find-count-badge" id="findCountBadge">0 of 0</span>
              </div>
              <button class="find-tool-btn" id="btnFindMatchCase" title="Match Case (Alt+C)">Aa</button>
              <button class="find-tool-btn" id="btnFindPrev" title="Previous Match (Shift+Enter)">▲</button>
              <button class="find-tool-btn" id="btnFindNext" title="Next Match (Enter)">▼</button>
              <button class="find-tool-btn" id="btnToggleReplaceMode" title="Toggle Replace Row (Ctrl+H)">⇄</button>
              <button class="find-close-btn" id="btnCloseFind" title="Close (Escape)">✕</button>
            </div>
            <div class="replace-row" id="replaceRow" style="display: none;">
              <div class="find-input-wrap">
                <input type="text" id="replaceInput" placeholder="Replace with..." autocomplete="off">
              </div>
              <button class="find-action-btn" id="btnReplaceOne">Replace</button>
              <button class="find-action-btn" id="btnReplaceAll">Replace All</button>
            </div>
          </div>
`;

html = html.replace('<!-- Editor Body (Interactive Workspace with Visible Blinking Cursor) -->', findReplaceBarHtml + '\n          <!-- Editor Body (Interactive Workspace with Visible Blinking Cursor) -->');

// Insert Draggable Resizer between editor-card and terminal-card
const resizerHtml = `
        <!-- Draggable Workspace Resizer (Requirement 2) -->
        <div class="workspace-resizer" id="workspaceResizer" title="Drag to resize Editor / Terminal">
          <div class="resizer-handle-pill"></div>
        </div>
`;

html = html.replace('<!-- Execution Panel / Terminal Card -->', resizerHtml + '\n        <!-- Execution Panel / Terminal Card -->');

// Add History tab button in .terminal-tabs
const historyTabBtn = `
              <button class="terminal-tab-btn" data-term-tab="history">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>History</span>
              </button>
`;
html = html.replace('<button class="terminal-tab-btn" data-term-tab="problems">', historyTabBtn + '              <button class="terminal-tab-btn" data-term-tab="problems">');

// Add Terminal Toolbar tools: Copy, Download, Maximize, Collapse
const terminalToolsHtml = `
              <!-- Copy Terminal Output -->
              <button class="btn-terminal-clear" id="btnTerminalCopy" title="Copy Output to Clipboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>

              <!-- Download Terminal Output -->
              <button class="btn-terminal-clear" id="btnTerminalDownload" title="Download Output (.txt)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>

              <!-- Maximize Terminal -->
              <button class="btn-terminal-clear" id="btnTerminalMaximize" title="Maximize Terminal (Toggle)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>

              <!-- Collapse / Expand Terminal -->
              <button class="btn-terminal-clear" id="btnTerminalCollapse" title="Collapse / Expand Terminal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="iconCollapseTerminal">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
`;
html = html.replace(
`<button class="btn-terminal-clear" id="btnTerminalClear" title="Clear Terminal Log">`,
terminalToolsHtml + '\n              <button class="btn-terminal-clear" id="btnTerminalClear" title="Clear Terminal Log">'
);

// Add History Tab View in .terminal-card before </div>\n\n      </section>
const historyViewHtml = `
          <!-- Tab 5: Run History View (Requirement 5) -->
          <div class="terminal-body terminal-tab-view" id="termViewHistory">
            <div class="term-header-line" style="display:flex; justify-content:space-between; align-items:center;">
              <span>EXECUTION RUN HISTORY (LAST 20 RUNS)</span>
              <button id="btnClearRunHistory" style="background:var(--card-bg-subtle); border:1px solid var(--glass-panel-border); border-radius:6px; font-size:11px; padding:3px 8px; cursor:pointer; color:var(--text-secondary); transition:all 0.15s ease;">Clear History</button>
            </div>
            <div id="runHistoryListContainer" style="margin-top:8px;"></div>
          </div>
`;

html = html.replace(
`            <div id="problemsListContainer">
              <div class="problems-empty-state">
                <span>✓</span> <span>No syntax errors or compilation warnings detected.</span>
              </div>
            </div>
          </div>
        </div>`,
`            <div id="problemsListContainer">
              <div class="problems-empty-state">
                <span>✓</span> <span>No syntax errors or compilation warnings detected.</span>
              </div>
            </div>
          </div>
${historyViewHtml}
        </div>`
);

// Update Status Bar with encoding, line ending, indentation, wrap status
html = html.replace(
`<div class="editor-stats">
              <span id="statLnCol">Ln 5, Col 14</span>
              <span class="stat-sep">|</span>
              <span id="statLines">7 lines</span>
              <span class="stat-sep">|</span>
              <span id="statChars">74 characters</span>
            </div>`,
`<div class="editor-stats">
              <span id="statLnCol">Ln 5, Col 14</span>
              <span class="stat-sep">|</span>
              <span id="statLines">7 lines</span>
              <span class="stat-sep">|</span>
              <span id="statChars">74 characters</span>
              <span class="stat-sep">|</span>
              <span id="statEncoding">UTF-8</span>
              <span class="stat-sep">|</span>
              <span id="statLineEnding">LF</span>
              <span class="stat-sep">|</span>
              <span id="statSpaces">Spaces: 4</span>
              <span class="stat-sep">|</span>
              <span id="statWrap">Wrap: Off</span>
            </div>`
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Markup and CSS replacements applied successfully!');
