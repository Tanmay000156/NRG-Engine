// Master Script to apply all IDE, Rendering, Workspace & Developer Signature upgrades
const fs = require('fs');

const filePath = 'C:/Users/tanma/nrg-engine/index.html';
let html = fs.readFileSync(filePath, 'utf8');
html = html.replace(/\r\n/g, '\n');

console.log('Original lines:', html.split('\n').length);

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
html = html.replace('</style>', () => cssAdditions + '\n  </style>');

// Fix .term-output-text in CSS to strictly pre-wrap and monospace
html = html.replace(
`.term-output-text {
      margin: 6px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-main);
    }`,
() => `.term-output-text {
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
() => `.term-log-stream {
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

// =========================================================================
// 2. HTML MARKUP UPGRADES
// =========================================================================

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
html = html.replace('<!-- Sidebar Footer Version -->', () => devSigMarkup + '\n        <!-- Sidebar Footer Version -->');

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
() => editorMoreReplacement
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

html = html.replace('<!-- Editor Body (Interactive Workspace with Visible Blinking Cursor) -->', () => findReplaceBarHtml + '\n          <!-- Editor Body (Interactive Workspace with Visible Blinking Cursor) -->');

// Insert Draggable Resizer between editor-card and terminal-card
const resizerHtml = `
        <!-- Draggable Workspace Resizer (Requirement 2) -->
        <div class="workspace-resizer" id="workspaceResizer" title="Drag to resize Editor / Terminal">
          <div class="resizer-handle-pill"></div>
        </div>
`;

html = html.replace('<!-- Execution Panel / Terminal Card -->', () => resizerHtml + '\n        <!-- Execution Panel / Terminal Card -->');

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
html = html.replace('<button class="terminal-tab-btn" data-term-tab="problems">', () => historyTabBtn + '              <button class="terminal-tab-btn" data-term-tab="problems">');

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
() => terminalToolsHtml + '\n              <button class="btn-terminal-clear" id="btnTerminalClear" title="Clear Terminal Log">'
);

// Add History Tab View in .terminal-card before problems closing div
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
                <span>✓</span> <span>No compilation errors or warnings detected.</span>
              </div>
            </div>
          </div>
        </div>`,
() => `            <div id="problemsListContainer">
              <div class="problems-empty-state">
                <span>✓</span> <span>No compilation errors or warnings detected.</span>
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
() => `<div class="editor-stats">
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

// =========================================================================
// 3. JAVASCRIPT LOGIC UPGRADES
// =========================================================================
const jsUpgrades = `
    // ==========================================================================
    // ADVANCED WORKSPACE, MULTI-TAB & RENDERING ENGINE UPGRADE
    // ==========================================================================

    // --- 1. Terminal ANSI & Multiline Preserving Renderer ---
    function renderAnsiTerminal(text) {
      if (!text) return '';
      const escaped = escapeHtml(text);
      
      const colorMap = {
        '30': 'var(--text-muted, #94a3b8)',
        '31': '#ef4444',
        '32': '#22c55e',
        '33': '#f59e0b',
        '34': '#3b82f6',
        '35': '#a855f7',
        '36': '#06b6d4',
        '37': '#f8fafc',
        '90': '#64748b',
        '91': '#f87171',
        '92': '#4ade80',
        '93': '#fbbf24',
        '94': '#60a5fa',
        '95': '#c084fc',
        '96': '#22d3ee',
        '97': '#ffffff'
      };

      const bgMap = {
        '40': '#0f172a',
        '41': '#7f1d1d',
        '42': '#14532d',
        '43': '#78350f',
        '44': '#1e3a8a',
        '45': '#581c87',
        '46': '#164e63',
        '47': '#e2e8f0'
      };

      return escaped.replace(/\\x1b\\[([0-9;]*)m/g, (match, codes) => {
        if (!codes || codes === '0') return '</span>';
        const parts = codes.split(';');
        let styles = [];
        for (const p of parts) {
          if (p === '0') return '</span>';
          if (p === '1') styles.push('font-weight:bold');
          if (p === '2') styles.push('opacity:0.7');
          if (p === '4') styles.push('text-decoration:underline');
          if (colorMap[p]) styles.push('color:' + colorMap[p]);
          if (bgMap[p]) styles.push('background:' + bgMap[p]);
        }
        return '</span><span style="' + styles.join(';') + '">';
      });
    }

    // --- 2. Multi-Tab File System State ---
    let openFiles = [
      {
        id: 'file-1',
        name: LANGUAGES['c'].file,
        lang: 'c',
        code: LANGUAGES['c'].template,
        isDirty: false
      }
    ];
    let activeFileId = 'file-1';
    let fileIdCounter = 2;

    function getActiveFile() {
      return openFiles.find(f => f.id === activeFileId) || openFiles[0];
    }

    function renderFileTabs() {
      const container = document.getElementById('editorTabsContainer');
      if (!container) return;
      
      let htmlStr = '';
      openFiles.forEach(file => {
        const isActive = file.id === activeFileId;
        const langData = LANGUAGES[file.lang] || { badge: 'TXT', badgeBg: '#64748b' };
        htmlStr += \`
          <div class="file-tab \${isActive ? 'active' : ''}" data-file-id="\${file.id}">
            <span class="lang-badge-icon" style="background:\${langData.badgeBg};">\${langData.badge}</span>
            <span class="file-tab-name">\${escapeHtml(file.name)}</span>
            \${file.isDirty ? '<span class="tab-dirty-dot" title="Unsaved changes">•</span>' : ''}
            <span class="tab-close" data-file-id="\${file.id}" title="Close Tab">×</span>
          </div>
        \`;
      });
      htmlStr += '<button class="btn-new-tab" id="btnNewTab" title="New File Tab">+</button>';
      container.innerHTML = htmlStr;

      // Attach tab click events
      container.querySelectorAll('.file-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          if (e.target.classList.contains('tab-close')) return;
          activateFile(tab.dataset.fileId);
        });
      });

      // Attach tab close events
      container.querySelectorAll('.tab-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeFileTab(closeBtn.dataset.fileId);
        });
      });

      // Attach new tab button
      const newTabBtn = document.getElementById('btnNewTab');
      if (newTabBtn) {
        newTabBtn.addEventListener('click', () => promptCreateNewFile());
      }
    }

    function activateFile(fileId) {
      const file = openFiles.find(f => f.id === fileId);
      if (!file) return;

      const prevFile = getActiveFile();
      if (prevFile && prevFile.id !== fileId) {
        prevFile.code = codeInput.value;
      }

      activeFileId = fileId;
      currentLang = file.lang;
      currentCode = file.code;
      codeInput.value = currentCode;

      const breadcrumbFilename = document.getElementById('breadcrumbFilename');
      if (breadcrumbFilename) breadcrumbFilename.textContent = file.name;

      const langData = LANGUAGES[file.lang] || { badge: 'TXT', badgeBg: '#64748b', compiler: 'Text' };
      const compilerBadgeIcon = document.getElementById('compilerBadgeIcon');
      const compilerLabelText = document.getElementById('compilerLabelText');
      if (compilerBadgeIcon) {
        compilerBadgeIcon.textContent = langData.badge;
        compilerBadgeIcon.style.background = langData.badgeBg;
      }
      if (compilerLabelText) {
        compilerLabelText.textContent = langData.compiler;
      }

      document.querySelectorAll('.lang-item').forEach(item => {
        item.classList.toggle('active', item.dataset.lang === file.lang);
      });

      renderFileTabs();
      updateEditorDisplay();
      calculateCaretPosition();
    }

    function promptCreateNewFile() {
      const defaultName = \`script_\${fileIdCounter}.\${currentLang === 'c' ? 'c' : (LANGUAGES[currentLang]?.ext || 'c')}\`;
      const fileName = prompt('Enter new file name (e.g. main.cpp, script.py, solution.java):', defaultName);
      if (!fileName || !fileName.trim()) return;
      
      const trimmedName = fileName.trim();
      const ext = trimmedName.split('.').pop().toLowerCase();
      let detectedLang = currentLang;

      const extMap = {
        'c': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'h': 'c', 'hpp': 'cpp',
        'java': 'java', 'py': 'python', 'js': 'javascript', 'ts': 'javascript',
        'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'php': 'php', 'kt': 'kotlin', 'kts': 'kotlin'
      };
      if (extMap[ext] && LANGUAGES[extMap[ext]]) {
        detectedLang = extMap[ext];
      }

      const newFile = {
        id: 'file-' + fileIdCounter++,
        name: trimmedName,
        lang: detectedLang,
        code: LANGUAGES[detectedLang]?.template || '// New file\\n',
        isDirty: false
      };

      openFiles.push(newFile);
      activateFile(newFile.id);
      showToast(\`Created \${trimmedName}\`);
    }

    function renameActiveFile() {
      const activeFile = getActiveFile();
      const newName = prompt('Enter new file name:', activeFile.name);
      if (!newName || !newName.trim() || newName.trim() === activeFile.name) return;

      const trimmedName = newName.trim();
      activeFile.name = trimmedName;

      const ext = trimmedName.split('.').pop().toLowerCase();
      const extMap = {
        'c': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'h': 'c', 'hpp': 'cpp',
        'java': 'java', 'py': 'python', 'js': 'javascript', 'ts': 'javascript',
        'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'php': 'php', 'kt': 'kotlin', 'kts': 'kotlin'
      };
      if (extMap[ext] && LANGUAGES[extMap[ext]]) {
        activeFile.lang = extMap[ext];
      }

      activateFile(activeFile.id);
      showToast(\`Renamed to \${trimmedName}\`);
    }

    function duplicateActiveFile() {
      const activeFile = getActiveFile();
      const parts = activeFile.name.split('.');
      let dupName = parts.length > 1
        ? parts.slice(0, -1).join('.') + '_copy.' + parts[parts.length - 1]
        : activeFile.name + '_copy';

      const newFile = {
        id: 'file-' + fileIdCounter++,
        name: dupName,
        lang: activeFile.lang,
        code: codeInput.value,
        isDirty: true
      };

      openFiles.push(newFile);
      activateFile(newFile.id);
      showToast(\`Duplicated as \${dupName}\`);
    }

    function saveActiveFile() {
      const activeFile = getActiveFile();
      activeFile.code = codeInput.value;
      activeFile.isDirty = false;
      renderFileTabs();
      showToast(\`Saved \${activeFile.name}\`);
    }

    function saveAsFile() {
      const activeFile = getActiveFile();
      const newName = prompt('Save As (enter file name):', activeFile.name);
      if (!newName || !newName.trim()) return;

      const trimmedName = newName.trim();
      const ext = trimmedName.split('.').pop().toLowerCase();
      const extMap = {
        'c': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'h': 'c', 'hpp': 'cpp',
        'java': 'java', 'py': 'python', 'js': 'javascript', 'ts': 'javascript',
        'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'php': 'php', 'kt': 'kotlin', 'kts': 'kotlin'
      };
      let detectedLang = activeFile.lang;
      if (extMap[ext] && LANGUAGES[extMap[ext]]) {
        detectedLang = extMap[ext];
      }

      const newFile = {
        id: 'file-' + fileIdCounter++,
        name: trimmedName,
        lang: detectedLang,
        code: codeInput.value,
        isDirty: false
      };

      openFiles.push(newFile);
      activateFile(newFile.id);
      showToast(\`Saved as \${trimmedName}\`);
    }

    function closeFileTab(fileId) {
      const fileToClose = openFiles.find(f => f.id === fileId);
      if (!fileToClose) return;

      if (fileToClose.isDirty) {
        const confirmClose = confirm(\`"\${fileToClose.name}" has unsaved changes. Close anyway?\`);
        if (!confirmClose) return;
      }

      if (openFiles.length === 1) {
        fileToClose.name = 'main.c';
        fileToClose.lang = 'c';
        fileToClose.code = LANGUAGES['c'].template;
        fileToClose.isDirty = false;
        activateFile(fileToClose.id);
        showToast('Reset file tab');
        return;
      }

      const closeIndex = openFiles.findIndex(f => f.id === fileId);
      openFiles = openFiles.filter(f => f.id !== fileId);

      if (activeFileId === fileId) {
        const nextIndex = Math.min(closeIndex, openFiles.length - 1);
        activateFile(openFiles[nextIndex].id);
      } else {
        renderFileTabs();
      }
    }

    function downloadActiveFile() {
      const activeFile = getActiveFile();
      const blob = new Blob([codeInput.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(\`Downloaded \${activeFile.name}\`);
    }

    function exportAsHtml() {
      const activeFile = getActiveFile();
      const codeHtml = highlightSyntax(codeInput.value, activeFile.lang);
      const lines = codeInput.value.split('\\n');
      let lineNums = '';
      for (let i = 1; i <= lines.length; i++) {
        lineNums += \`<div>\${i}</div>\`;
      }

      const fullHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>\${escapeHtml(activeFile.name)} — NRG Engine Export</title>
  <style>
    body {
      margin: 0;
      padding: 30px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0b0f19;
      color: #f8fafc;
    }
    .export-card {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .export-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(30, 41, 59, 0.5);
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      background: linear-gradient(135deg, #0066ff, #00d2ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .file-meta {
      font-size: 13px;
      color: #94a3b8;
      font-family: "JetBrains Mono", Consolas, monospace;
    }
    .editor-wrapper {
      display: flex;
      padding: 16px 0;
      font-family: "JetBrains Mono", Consolas, monospace;
      font-size: 14px;
      line-height: 24px;
    }
    .line-numbers {
      padding: 0 16px;
      color: #475569;
      text-align: right;
      user-select: none;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
    }
    .code-content {
      padding: 0 20px;
      flex: 1;
      overflow-x: auto;
      white-space: pre;
    }
    .syn-preproc { color: #c084fc; font-weight: bold; }
    .syn-keyword { color: #38bdf8; font-weight: bold; }
    .syn-string  { color: #f87171; }
    .syn-func    { color: #e2e8f0; font-weight: bold; }
    .syn-number  { color: #fbbf24; }
    .syn-comment { color: #94a3b8; font-style: italic; }
    .export-footer {
      padding: 12px 24px;
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.4);
    }
  </style>
</head>
<body>
  <div class="export-card">
    <div class="export-header">
      <div class="brand-title">NRG ENGINE</div>
      <div class="file-meta">\${escapeHtml(activeFile.name)} &bull; \${LANGUAGES[activeFile.lang]?.name || 'Code'} &bull; \${new Date().toLocaleDateString()}</div>
    </div>
    <div class="editor-wrapper">
      <div class="line-numbers">\${lineNums}</div>
      <div class="code-content">\${codeHtml}</div>
    </div>
    <div class="export-footer">
      Exported from NRG Engine Cloud Coding Platform &bull; Developed by Tanmay Verma
    </div>
  </div>
</body>
</html>\`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`\${activeFile.name}.html\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(\`Exported as \${activeFile.name}.html\`);
    }

    // --- 3. Workspace Resizer & Layout Persistence ---
    function initWorkspaceResizer() {
      const resizer = document.getElementById('workspaceResizer');
      const centerCol = document.getElementById('viewCenterEditor');
      const editorCard = document.querySelector('.editor-card');
      const terminalCard = document.querySelector('.terminal-card');

      if (!resizer || !centerCol || !editorCard || !terminalCard) return;

      let isResizing = false;
      let startY = 0;
      let startHeight = 0;

      function onPointerDown(e) {
        isResizing = true;
        document.body.classList.add('resizing-vertical');
        resizer.classList.add('is-dragging');
        startY = e.clientY || (e.touches && e.touches[0].clientY);
        startHeight = editorCard.getBoundingClientRect().height;
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!isResizing) return;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const delta = clientY - startY;
        const totalHeight = centerCol.getBoundingClientRect().height;
        const minEditor = 120;
        const minTerminal = 90;
        const maxEditor = totalHeight - minTerminal - 25;

        const newEditorHeight = Math.max(minEditor, Math.min(startHeight + delta, maxEditor));
        editorCard.style.flex = 'none';
        editorCard.style.height = \`\${newEditorHeight}px\`;
        terminalCard.style.flex = '1';
        terminalCard.style.height = 'auto';
      }

      function onPointerUp() {
        if (isResizing) {
          isResizing = false;
          document.body.classList.remove('resizing-vertical');
          resizer.classList.remove('is-dragging');
          
          const currentHeight = editorCard.getBoundingClientRect().height;
          localStorage.setItem('nrg_workspace_state', JSON.stringify({
            editorHeight: currentHeight
          }));
        }
      }

      resizer.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      resizer.addEventListener('touchstart', onPointerDown, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);

      try {
        const savedState = JSON.parse(localStorage.getItem('nrg_workspace_state') || '{}');
        if (savedState.editorHeight && savedState.editorHeight >= 120) {
          editorCard.style.flex = 'none';
          editorCard.style.height = \`\${savedState.editorHeight}px\`;
          terminalCard.style.flex = '1';
        }
      } catch (err) {}
    }

    function toggleMaximizeEditor() {
      const centerCol = document.getElementById('viewCenterEditor');
      centerCol.classList.remove('terminal-maximized', 'terminal-collapsed');
      const isMax = centerCol.classList.toggle('editor-maximized');
      showToast(isMax ? 'Editor Maximized' : 'Editor Restored');
    }

    function toggleMaximizeTerminal() {
      const centerCol = document.getElementById('viewCenterEditor');
      centerCol.classList.remove('editor-maximized', 'terminal-collapsed');
      const isMax = centerCol.classList.toggle('terminal-maximized');
      showToast(isMax ? 'Terminal Maximized' : 'Terminal Restored');
    }

    function toggleCollapseTerminal() {
      const centerCol = document.getElementById('viewCenterEditor');
      centerCol.classList.remove('editor-maximized', 'terminal-maximized');
      const isCollapsed = centerCol.classList.toggle('terminal-collapsed');
      const icon = document.getElementById('iconCollapseTerminal');
      if (icon) {
        icon.innerHTML = isCollapsed
          ? '<polyline points="18 15 12 9 6 15"></polyline>'
          : '<polyline points="6 9 12 15 18 9"></polyline>';
      }
      showToast(isCollapsed ? 'Terminal Collapsed' : 'Terminal Restored');
    }

    function resetWorkspaceLayout() {
      const centerCol = document.getElementById('viewCenterEditor');
      const editorCard = document.querySelector('.editor-card');
      const terminalCard = document.querySelector('.terminal-card');
      const appMain = document.querySelector('.app-main');

      centerCol.classList.remove('editor-maximized', 'terminal-maximized', 'terminal-collapsed');
      if (appMain) appMain.classList.remove('right-panel-hidden');

      editorCard.style.flex = '1.25';
      editorCard.style.height = '';
      terminalCard.style.flex = '0.85';
      terminalCard.style.height = '';

      localStorage.removeItem('nrg_workspace_state');
      showToast('Workspace layout reset to default');
    }

    function toggleRightPanel() {
      const appMain = document.querySelector('.app-main');
      if (appMain) {
        const isHidden = appMain.classList.toggle('right-panel-hidden');
        showToast(isHidden ? 'Right panel hidden (Wide Editor)' : 'Right panel visible');
      }
    }

    // --- 4. Font Size & Word Wrap Controls ---
    let currentEditorFontSize = 14;
    function setEditorFontSize(newSize) {
      currentEditorFontSize = Math.max(11, Math.min(newSize, 24));
      document.documentElement.style.setProperty('--editor-font-size', \`\${currentEditorFontSize}px\`);
      updateEditorDisplay();
      showToast(\`Font size: \${currentEditorFontSize}px\`);
    }

    let isWordWrap = false;
    function toggleWordWrap() {
      const bodyWrap = document.getElementById('editorBodyWrap');
      const wrapStat = document.getElementById('statWrap');
      const menuWrapState = document.getElementById('menuWrapState');
      isWordWrap = !isWordWrap;
      bodyWrap.classList.toggle('word-wrap', isWordWrap);
      if (wrapStat) wrapStat.textContent = \`Wrap: \${isWordWrap ? 'On' : 'Off'}\`;
      if (menuWrapState) menuWrapState.textContent = isWordWrap ? 'On' : 'Off';
      showToast(\`Word Wrap: \${isWordWrap ? 'ON' : 'OFF'}\`);
    }

    let isLineNumbersVisible = true;
    function toggleLineNumbers() {
      const gutter = document.getElementById('editorLineNumbers');
      isLineNumbersVisible = !isLineNumbersVisible;
      gutter.style.display = isLineNumbersVisible ? 'block' : 'none';
      showToast(\`Line numbers \${isLineNumbersVisible ? 'shown' : 'hidden'}\`);
    }

    // --- 5. Floating Find & Replace Engine ---
    let findMatches = [];
    let currentMatchIndex = -1;
    let findMatchCase = false;

    function openFindBar(withReplace = false) {
      const bar = document.getElementById('findReplaceBar');
      const repRow = document.getElementById('replaceRow');
      const findInput = document.getElementById('findInput');
      const repInput = document.getElementById('replaceInput');

      bar.style.display = 'flex';
      repRow.style.display = withReplace ? 'flex' : 'none';

      const selStart = codeInput.selectionStart;
      const selEnd = codeInput.selectionEnd;
      if (selStart !== selEnd) {
        const selectedText = codeInput.value.substring(selStart, selEnd);
        if (selectedText.length < 50 && !selectedText.includes('\\n')) {
          findInput.value = selectedText;
        }
      }

      if (withReplace) {
        repInput.focus();
      } else {
        findInput.focus();
        findInput.select();
      }
      performFind();
    }

    function closeFindBar() {
      const bar = document.getElementById('findReplaceBar');
      if (bar) bar.style.display = 'none';
      codeInput.focus();
    }

    function performFind() {
      const findInput = document.getElementById('findInput');
      const countBadge = document.getElementById('findCountBadge');
      const term = findInput.value;

      findMatches = [];
      currentMatchIndex = -1;

      if (!term) {
        countBadge.textContent = '0 of 0';
        return;
      }

      const text = codeInput.value;
      const flags = findMatchCase ? 'g' : 'gi';
      const escapedTerm = term.replace(/[.*+?^$\${}()|[\\]\\\\]/g, (c) => '\\\\' + c);
      const regex = new RegExp(escapedTerm, flags);

      let match;
      while ((match = regex.exec(text)) !== null) {
        findMatches.push({
          start: match.index,
          end: match.index + match[0].length
        });
      }

      if (findMatches.length > 0) {
        const selStart = codeInput.selectionStart;
        currentMatchIndex = findMatches.findIndex(m => m.start >= selStart);
        if (currentMatchIndex === -1) currentMatchIndex = 0;
        countBadge.textContent = \`\${currentMatchIndex + 1} of \${findMatches.length}\`;
        highlightFindMatch(currentMatchIndex);
      } else {
        countBadge.textContent = '0 of 0';
      }
    }

    function highlightFindMatch(idx) {
      if (idx < 0 || idx >= findMatches.length) return;
      const m = findMatches[idx];
      codeInput.focus();
      codeInput.setSelectionRange(m.start, m.end);
      calculateCaretPosition();
      
      const countBadge = document.getElementById('findCountBadge');
      if (countBadge) countBadge.textContent = \`\${idx + 1} of \${findMatches.length}\`;
    }

    function findNext() {
      if (findMatches.length === 0) return;
      currentMatchIndex = (currentMatchIndex + 1) % findMatches.length;
      highlightFindMatch(currentMatchIndex);
    }

    function findPrev() {
      if (findMatches.length === 0) return;
      currentMatchIndex = (currentMatchIndex - 1 + findMatches.length) % findMatches.length;
      highlightFindMatch(currentMatchIndex);
    }

    function replaceCurrentMatch() {
      if (currentMatchIndex < 0 || currentMatchIndex >= findMatches.length) return;
      const repInput = document.getElementById('replaceInput');
      const replacement = repInput.value;
      const m = findMatches[currentMatchIndex];

      const val = codeInput.value;
      codeInput.value = val.substring(0, m.start) + replacement + val.substring(m.end);
      currentCode = codeInput.value;
      getActiveFile().isDirty = true;
      renderFileTabs();
      updateEditorDisplay();

      performFind();
    }

    function replaceAllMatches() {
      const findInput = document.getElementById('findInput');
      const repInput = document.getElementById('replaceInput');
      const term = findInput.value;
      if (!term) return;

      const replacement = repInput.value;
      const flags = findMatchCase ? 'g' : 'gi';
      const escapedTerm = term.replace(/[.*+?^$\${}()|[\\]\\\\]/g, (c) => '\\\\' + c);
      const regex = new RegExp(escapedTerm, flags);

      const val = codeInput.value;
      const count = (val.match(regex) || []).length;
      if (count === 0) {
        showToast('No occurrences to replace');
        return;
      }

      codeInput.value = val.replace(regex, replacement);
      currentCode = codeInput.value;
      getActiveFile().isDirty = true;
      renderFileTabs();
      updateEditorDisplay();
      performFind();
      showToast(\`Replaced \${count} occurrence\${count > 1 ? 's' : ''}\`);
    }

    // --- 6. Execution Run History Engine ---
    let runHistory = [];
    try {
      runHistory = JSON.parse(localStorage.getItem('nrg_run_history') || '[]');
    } catch (e) {
      runHistory = [];
    }

    function recordRunHistory(data) {
      const activeFile = getActiveFile();
      const statusId = data.status ? data.status.id : (data.exit_code === 0 ? 3 : 11);
      let statusType = 'success';
      if (statusId === 6 || data.compile_output) statusType = 'error';
      else if (statusId === 5) statusType = 'timeout';
      else if (statusId !== 3) statusType = 'error';

      const entry = {
        id: 'run_' + Date.now(),
        timestamp: Date.now(),
        timeStr: new Date().toLocaleTimeString(),
        dateStr: new Date().toLocaleDateString(),
        fileName: activeFile.name,
        lang: activeFile.lang,
        langName: LANGUAGES[activeFile.lang]?.name || 'C',
        compiler: data.compiler || LANGUAGES[activeFile.lang]?.compiler || 'GCC',
        statusType: statusType,
        statusDesc: data.status?.description || (statusType === 'success' ? 'Accepted' : 'Failed'),
        time: data.time || '0.00',
        memory: data.memory ? (data.memory / 1024).toFixed(2) : '0.00',
        exitCode: data.exit_code !== undefined ? data.exit_code : 0,
        stdout: data.stdout || '',
        stderr: data.compile_output || data.stderr || '',
        codeSnippet: codeInput.value.substring(0, 100)
      };

      runHistory.unshift(entry);
      if (runHistory.length > 20) runHistory = runHistory.slice(0, 20);
      try {
        localStorage.setItem('nrg_run_history', JSON.stringify(runHistory));
      } catch (err) {}

      renderRunHistory();
    }

    function renderRunHistory() {
      const container = document.getElementById('runHistoryListContainer');
      if (!container) return;

      if (runHistory.length === 0) {
        container.innerHTML = \`
          <div class="problems-empty-state">
            <span>⏱</span> <span>No execution history recorded yet. Run code to populate history.</span>
          </div>
        \`;
        return;
      }

      container.innerHTML = runHistory.map(item => \`
        <div class="history-card-item status-\${item.statusType}">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <div style="font-weight:700; font-size:12.5px; color:var(--text-main); display:flex; align-items:center; gap:6px;">
              <span>\${item.statusType === 'success' ? '✔' : (item.statusType === 'timeout' ? '⏱' : '❌')}</span>
              <span>\${escapeHtml(item.fileName)}</span>
              <span style="font-size:10px; font-weight:800; background:rgba(148,163,184,0.15); padding:1px 5px; border-radius:4px;">\${item.langName}</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted);">
              \${item.statusDesc} &bull; Time: \${item.time}s &bull; Memory: \${item.memory}MB &bull; Exit: \${item.exitCode}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; font-weight:600; color:var(--text-secondary);">\${item.timeStr}</div>
            <button onclick="navigator.clipboard.writeText(\\\`\${escapeHtml(item.stdout || item.stderr).replace(/\\n/g, '\\\\n')}\\\`); showToast('Output copied!');" style="background:transparent; border:1px solid var(--glass-panel-border); border-radius:4px; font-size:10px; padding:2px 6px; cursor:pointer; color:var(--text-secondary); margin-top:3px;">Copy Output</button>
          </div>
        </div>
      \`).join('');
    }

    // --- 7. Three-Dot Workspace Menu Toggle & Actions ---
    const btnEditorMore = document.getElementById('btnEditorMore');
    const workspaceDropdownMenu = document.getElementById('workspaceDropdownMenu');

    if (btnEditorMore && workspaceDropdownMenu) {
      btnEditorMore.addEventListener('click', (e) => {
        e.stopPropagation();
        workspaceDropdownMenu.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!workspaceDropdownMenu.contains(e.target) && e.target !== btnEditorMore) {
          workspaceDropdownMenu.classList.remove('active');
        }
      });
    }

    document.getElementById('menuNewFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      promptCreateNewFile();
    });
    document.getElementById('menuRenameFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      renameActiveFile();
    });
    document.getElementById('menuDuplicateFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      duplicateActiveFile();
    });
    document.getElementById('menuSaveFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      saveActiveFile();
    });
    document.getElementById('menuSaveAsFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      saveAsFile();
    });
    document.getElementById('menuDownloadFile')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      downloadActiveFile();
    });
    document.getElementById('menuExportHtml')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      exportAsHtml();
    });
    document.getElementById('menuCloseTab')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      closeFileTab(activeFileId);
    });

    document.getElementById('menuUndo')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      document.execCommand('undo');
    });
    document.getElementById('menuRedo')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      document.execCommand('redo');
    });
    document.getElementById('menuFind')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      openFindBar(false);
    });
    document.getElementById('menuFindReplace')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      openFindBar(true);
    });
    document.getElementById('menuSelectAll')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      codeInput.focus();
      codeInput.select();
    });
    document.getElementById('menuCopyAll')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      navigator.clipboard.writeText(codeInput.value);
      showToast('All code copied to clipboard');
    });
    document.getElementById('menuFormatDoc')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      document.getElementById('btnActionFormat').click();
    });

    document.getElementById('menuToggleWrap')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      toggleWordWrap();
    });
    document.getElementById('menuFontIncrease')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      setEditorFontSize(currentEditorFontSize + 1);
    });
    document.getElementById('menuFontDecrease')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      setEditorFontSize(currentEditorFontSize - 1);
    });
    document.getElementById('menuFontReset')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      setEditorFontSize(14);
    });
    document.getElementById('menuToggleLineNumbers')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      toggleLineNumbers();
    });

    document.getElementById('menuToggleMaximizeEditor')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      toggleMaximizeEditor();
    });
    document.getElementById('btnEditorMaximize')?.addEventListener('click', toggleMaximizeEditor);

    document.getElementById('menuToggleTerminal')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      toggleCollapseTerminal();
    });
    document.getElementById('menuToggleRightPanel')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      toggleRightPanel();
    });
    document.getElementById('menuResetLayout')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      resetWorkspaceLayout();
    });
    document.getElementById('menuRunHistory')?.addEventListener('click', () => {
      workspaceDropdownMenu.classList.remove('active');
      switchTerminalTab('history');
    });

    // --- 8. Find Bar Events ---
    document.getElementById('findInput')?.addEventListener('input', performFind);
    document.getElementById('findInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) findPrev();
        else findNext();
      }
    });
    document.getElementById('replaceInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        replaceCurrentMatch();
      }
    });
    document.getElementById('btnFindNext')?.addEventListener('click', findNext);
    document.getElementById('btnFindPrev')?.addEventListener('click', findPrev);
    document.getElementById('btnReplaceOne')?.addEventListener('click', replaceCurrentMatch);
    document.getElementById('btnReplaceAll')?.addEventListener('click', replaceAllMatches);
    document.getElementById('btnCloseFind')?.addEventListener('click', closeFindBar);
    document.getElementById('btnFindMatchCase')?.addEventListener('click', function() {
      findMatchCase = !findMatchCase;
      this.classList.toggle('active', findMatchCase);
      performFind();
    });
    document.getElementById('btnToggleReplaceMode')?.addEventListener('click', () => {
      const repRow = document.getElementById('replaceRow');
      repRow.style.display = repRow.style.display === 'none' ? 'flex' : 'none';
    });

    // --- 9. Terminal Tool Buttons ---
    document.getElementById('btnTerminalCopy')?.addEventListener('click', () => {
      const activeTermTab = document.querySelector('.terminal-tab-btn.active')?.dataset.termTab;
      let textToCopy = '';
      if (activeTermTab === 'output') {
        textToCopy = document.getElementById('stdoutView')?.textContent || '';
      } else {
        const lastOutput = document.querySelector('.term-output-text:last-of-type');
        textToCopy = lastOutput ? lastOutput.textContent : document.getElementById('termLogStream')?.innerText;
      }
      navigator.clipboard.writeText(textToCopy);
      showToast('Output copied to clipboard');
    });

    document.getElementById('btnTerminalDownload')?.addEventListener('click', () => {
      const stdout = document.getElementById('stdoutView')?.textContent || '';
      const blob = new Blob([stdout], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nrg_output.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Output downloaded as nrg_output.txt');
    });

    document.getElementById('btnTerminalMaximize')?.addEventListener('click', toggleMaximizeTerminal);
    document.getElementById('btnTerminalCollapse')?.addEventListener('click', toggleCollapseTerminal);
    document.getElementById('btnClearRunHistory')?.addEventListener('click', () => {
      runHistory = [];
      localStorage.removeItem('nrg_run_history');
      renderRunHistory();
      showToast('Execution history cleared');
    });

    document.getElementById('btnEditorSave')?.addEventListener('click', saveActiveFile);

    initWorkspaceResizer();
    renderFileTabs();
    renderRunHistory();
`;

// Insert the JS upgrades right before Language Switching Mechanism
html = html.replace(
  `    // ==========================================================================
    // Language Switching Mechanism`,
  () => jsUpgrades + `\n    // ==========================================================================
    // Language Switching Mechanism`
);

// Upgrade switchLanguage to update active file in openFiles
html = html.replace(
`      currentCode = langData.template;
      codeInput.value = currentCode;
      activeLineNumber = langKey === 'c' ? 5 : 2;
      updateEditorDisplay();`,
() => `      currentCode = langData.template;
      codeInput.value = currentCode;
      activeLineNumber = langKey === 'c' ? 5 : 2;
      
      const curActive = getActiveFile();
      if (curActive) {
        curActive.lang = langKey;
        curActive.name = langData.file;
        curActive.code = currentCode;
        curActive.isDirty = false;
        renderFileTabs();
      }
      updateEditorDisplay();`
);

// Upgrade handleExecutionResult
const upgradedHandleResult = `
    function handleExecutionResult(data) {
      const terminalStatusBadge = document.getElementById('terminalStatusBadge');
      const terminalStatusText = document.getElementById('terminalStatusText');
      const termLogStream = document.getElementById('termLogStream');
      const stdoutView = document.getElementById('stdoutView');
      const problemsTabCount = document.getElementById('problemsTabCount');
      const problemsListContainer = document.getElementById('problemsListContainer');

      const isCompileError = data.status && data.status.id === 6; // Compilation Error
      const isAccepted = data.status && data.status.id === 3;     // Accepted
      const isTimeout = data.status && data.status.id === 5;      // Time Limit Exceeded
      const isRuntimeError = !isCompileError && !isAccepted && !isTimeout;

      // Update Problems Tab
      const problems = data.problems || [];
      problemsTabCount.textContent = \`Problems (\${problems.length})\`;

      if (problems.length === 0) {
        problemsListContainer.innerHTML = \`
          <div class="problems-empty-state">
            <span>✓</span> <span>No compilation errors or warnings detected.</span>
          </div>
        \`;
      } else {
        problemsListContainer.innerHTML = \`
          <div class="problem-cards-list">
            \${problems.map(p => \`
              <div class="problem-card \${p.severity}" onclick="jumpToLineAndColumn(\${p.line}, \${p.column})">
                <div class="problem-severity-badge">\${p.severity}</div>
                <div class="problem-details">
                  <div class="problem-title">\${escapeHtml(p.message)}</div>
                  <div class="problem-meta">
                    <span>\${escapeHtml(p.file)} [Ln \${p.line}, Col \${p.column}]</span>
                    <span>&bull;</span>
                    <span class="problem-jump-hint">Click to jump to line</span>
                  </div>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      }

      // Record in Run History
      recordRunHistory(data);

      // Case 1: Compilation Error
      if (isCompileError) {
        terminalStatusBadge.className = 'terminal-status-badge error';
        terminalStatusText.textContent = 'Compilation Failed';

        const compileErr = data.compile_output || data.stderr || 'Compilation error';
        termLogStream.innerHTML += \`
          <div class="term-error-line">
            <span>❌</span> <span>Compilation failed (\${data.compiler || 'GCC'})</span>
          </div>
          <div class="term-stderr-block">\${renderAnsiTerminal(compileErr)}</div>
          <div class="term-divider">------------------------------------</div>
          <div class="term-meta-line" style="color:#ef4444; font-weight:600;">
            Execution halted. \${problems.length} diagnostics generated. Click items in Problems tab to navigate.
          </div>
        \`;
        stdoutView.textContent = \`[Compilation Failed — No program output generated]\\n\\n\${compileErr}\`;
        showToast(\`Compilation failed (\${problems.length} errors)\`);
        const termBody = document.getElementById('termViewTerminal');
        if (termBody) termBody.scrollTop = termBody.scrollHeight;
        return;
      }

      // Case 2: Time Limit Exceeded
      if (isTimeout) {
        terminalStatusBadge.className = 'terminal-status-badge warning';
        terminalStatusText.textContent = 'Time Limit Exceeded';

        termLogStream.innerHTML += \`
          <div class="term-success-line">
            <span>✔</span> <span>Compilation successful (\${data.compiler || ''})</span>
          </div>
          <div class="term-warning-line">
            <span>⏱</span> <span>Time Limit Exceeded (5.00s CPU limit exceeded)</span>
          </div>
          <div class="term-divider">------------------------------------</div>
          <div class="term-meta-line">Execution safely terminated by sandbox resource controls.</div>
        \`;
        stdoutView.textContent = \`[Time Limit Exceeded — Execution killed after exceeding 5.00s limit]\`;
        showToast('Time Limit Exceeded');
        const termBody = document.getElementById('termViewTerminal');
        if (termBody) termBody.scrollTop = termBody.scrollHeight;
        return;
      }

      // Case 3: Runtime Error
      if (isRuntimeError) {
        terminalStatusBadge.className = 'terminal-status-badge error';
        terminalStatusText.textContent = 'Runtime Error';

        termLogStream.innerHTML += \`
          <div class="term-success-line">
            <span>✔</span> <span>Compilation successful (\${data.compiler || ''})</span>
          </div>
          <div class="term-error-line">
            <span>❌</span> <span>Runtime Error: \${data.status ? data.status.description : 'NZEC'}</span>
          </div>
          \${data.stderr ? \`<div class="term-stderr-block">\${renderAnsiTerminal(data.stderr)}</div>\` : ''}
          \${data.stdout ? \`<div class="term-output-text">\${renderAnsiTerminal(data.stdout)}</div>\` : ''}
          <div class="term-divider">------------------------------------</div>
          <div class="term-meta-line">Process exited with non-zero code \${data.exit_code} &bull; Time: \${data.time}s &bull; Memory: \${(data.memory/1024).toFixed(2)} MB</div>
        \`;
        stdoutView.textContent = data.stdout || (data.stderr ? \`[Stderr]:\\n\${data.stderr}\` : \`[Runtime Error: \${data.status ? data.status.description : 'Execution crashed'}]\`);
        showToast(\`Runtime Error (Exit Code \${data.exit_code})\`);
        const termBody = document.getElementById('termViewTerminal');
        if (termBody) termBody.scrollTop = termBody.scrollHeight;
        return;
      }

      // Case 4: Complete Success (Accepted & Exit Code 0)
      terminalStatusBadge.className = 'terminal-status-badge success';
      terminalStatusText.textContent = 'Success';

      const outputStr = data.stdout || '';
      termLogStream.innerHTML += \`
        <div class="term-success-line">
          <span>✔</span> <span>Compilation successful (\${data.compiler || ''})</span>
        </div>
        <div class="term-success-line">
          <span>✔</span> <span>Execution completed (Exit code 0)</span>
        </div>
        <div class="term-output-text">\${renderAnsiTerminal(outputStr || '(No text output printed)')}</div>
        <div class="term-divider">------------------------------------</div>
        <div class="term-meta-line">Process exited with code 0 &bull; Execution time: \${data.time}s &bull; Memory: \${(data.memory/1024).toFixed(2)} MB</div>
        <div class="term-meta-line" style="color:var(--primary-blue);">Mode: Judge0 CE Cloud Sandbox (Real Execution)</div>
      \`;
      stdoutView.textContent = outputStr || '(No text printed to stdout)';
      showToast('Execution finished with exit code 0');
      const termBody = document.getElementById('termViewTerminal');
      if (termBody) termBody.scrollTop = termBody.scrollHeight;
    }
`;

const origHandleResultStart = 'function handleExecutionResult(data) {';
const origHandleResultEnd = 'document.getElementById(\'btnActionRun\').addEventListener(\'click\', executeRealCode);';
const idxStart = html.indexOf(origHandleResultStart);
const idxEnd = html.indexOf(origHandleResultEnd);

if (idxStart !== -1 && idxEnd !== -1) {
  html = html.substring(0, idxStart) + upgradedHandleResult.trim() + '\n\n    ' + html.substring(idxEnd);
}

// Upgrade codeInput keydown handler with Auto Bracket Pairing & Indentation
const upgradedKeydown = `
    // Keyboard enhancements: Auto Bracket Closing, Indentation & Shortcuts
    codeInput.addEventListener('keydown', (e) => {
      const isAutoIndentOn = document.getElementById('toggleAutoIndent')?.checked ?? true;
      const tabSize = parseInt(document.getElementById('settingTabSizeSelect')?.value || '4');
      const spaces = ' '.repeat(tabSize);
      const start = codeInput.selectionStart;
      const end = codeInput.selectionEnd;
      const val = codeInput.value;

      getActiveFile().isDirty = true;
      renderFileTabs();

      if (e.key === 'Tab') {
        e.preventDefault();
        codeInput.value = val.substring(0, start) + spaces + val.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + tabSize;
        currentCode = codeInput.value;
        updateEditorDisplay();
        return;
      }

      const bracketPairs = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
        '\`': '\`'
      };

      if (bracketPairs[e.key]) {
        const closeChar = bracketPairs[e.key];
        if (start !== end) {
          e.preventDefault();
          const selectedText = val.substring(start, end);
          codeInput.value = val.substring(0, start) + e.key + selectedText + closeChar + val.substring(end);
          codeInput.selectionStart = start + 1;
          codeInput.selectionEnd = end + 1;
          currentCode = codeInput.value;
          updateEditorDisplay();
          return;
        } else {
          e.preventDefault();
          codeInput.value = val.substring(0, start) + e.key + closeChar + val.substring(end);
          codeInput.selectionStart = codeInput.selectionEnd = start + 1;
          currentCode = codeInput.value;
          updateEditorDisplay();
          return;
        }
      }

      const closingChars = [')', ']', '}', '"', "'", '\`'];
      if (closingChars.includes(e.key) && start === end && val[start] === e.key) {
        e.preventDefault();
        codeInput.selectionStart = codeInput.selectionEnd = start + 1;
        calculateCaretPosition();
        return;
      }

      if (e.key === 'Backspace' && start === end && start > 0) {
        const charBefore = val[start - 1];
        const charAfter = val[start];
        if (bracketPairs[charBefore] && bracketPairs[charBefore] === charAfter) {
          e.preventDefault();
          codeInput.value = val.substring(0, start - 1) + val.substring(start + 1);
          codeInput.selectionStart = codeInput.selectionEnd = start - 1;
          currentCode = codeInput.value;
          updateEditorDisplay();
          return;
        }
      }

      if (e.key === 'Enter') {
        if (!isAutoIndentOn) return;
        e.preventDefault();

        const lines = val.substring(0, start).split('\\n');
        const currentLine = lines[lines.length - 1];
        const currentIndentMatch = currentLine.match(/^(\\s*)/);
        let indent = currentIndentMatch ? currentIndentMatch[1] : '';

        const charBefore = val[start - 1];
        const charAfter = val[start];

        if (charBefore === '{' && charAfter === '}') {
          const extraIndent = indent + spaces;
          const insert = '\\n' + extraIndent + '\\n' + indent;
          codeInput.value = val.substring(0, start) + insert + val.substring(end);
          codeInput.selectionStart = codeInput.selectionEnd = start + 1 + extraIndent.length;
        } else {
          let extra = '';
          const trimmed = currentLine.trim();
          if (trimmed.endsWith('{') || trimmed.endsWith(':') || trimmed.endsWith('(') || trimmed.endsWith('[')) {
            extra = spaces;
          }
          const insert = '\\n' + indent + extra;
          codeInput.value = val.substring(0, start) + insert + val.substring(end);
          codeInput.selectionStart = codeInput.selectionEnd = start + insert.length;
        }

        currentCode = codeInput.value;
        updateEditorDisplay();
        calculateCaretPosition();
        return;
      }
    });
`;

html = html.replace(
  `    // Tab key support in textarea
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabSize = parseInt(document.getElementById('settingTabSizeSelect')?.value || '4');
        const spaces = ' '.repeat(tabSize);
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, start) + spaces + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + tabSize;
        currentCode = codeInput.value;
        updateEditorDisplay();
      }
    });`,
  () => upgradedKeydown.trim()
);

// Add global keyboard shortcuts
const globalShortcutsAddition = `
      // Workspace Upgrade Shortcuts
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openFindBar(false);
      }
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        openFindBar(true);
      }
      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveAsFile();
      }
      if (isCtrlOrCmd && e.key === '\`') {
        e.preventDefault();
        toggleCollapseTerminal();
      }
      if (isCtrlOrCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setEditorFontSize(currentEditorFontSize + 1);
      }
      if (isCtrlOrCmd && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setEditorFontSize(currentEditorFontSize - 1);
      }
      if (e.key === 'Escape') {
        closeFindBar();
        const menu = document.getElementById('workspaceDropdownMenu');
        if (menu) menu.classList.remove('active');
      }
`;

html = html.replace(
  `      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('btnActionFormat').click();
      }`,
  () => `      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('btnActionFormat').click();
      }
${globalShortcutsAddition}`
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('ALL UPGRADES APPLIED CLEANLY! New lines:', html.split('\n').length);
