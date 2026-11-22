const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('--- EXECUTING MASTER OVERHAUL ON NRG ENGINE ---');

// =========================================================================
// 1. UPDATE GRAPHICS & MODAL CSS TO USE THEME TOKENS
// =========================================================================

const masterThemeCSS = `
    /* ==========================================================================
       MASTER OVERHAUL: UNIFIED GRAPHICS & MODAL ARCHITECTURE
       ========================================================================== */
    
    /* Global Modal System (Bulletproof Pointer Events & Stacking) */
    .nrg-overlay-layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 0;
      z-index: 10000;
      pointer-events: none;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--modal-overlay-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10001 !important;
      opacity: 0;
      pointer-events: auto !important;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-overlay.open {
      display: flex !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    .modal-dialog {
      width: 92%;
      max-width: 540px;
      background: var(--modal-dialog-bg) !important;
      border: 1px solid var(--modal-dialog-border) !important;
      border-radius: var(--radius-card);
      box-shadow: var(--modal-dialog-shadow) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: var(--text-main) !important;
      overflow: hidden;
      pointer-events: auto !important;
      animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes modalPopIn {
      0% { transform: scale(0.96) translateY(6px); opacity: 0; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-bottom: 1px solid var(--modal-dialog-border);
      background: var(--modal-header-bg);
      flex-shrink: 0;
    }
    .modal-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    .modal-body {
      padding: 16px 20px;
      max-height: 70vh;
      overflow-y: auto;
      color: var(--text-main);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 18px;
      border-top: 1px solid var(--modal-dialog-border);
      background: var(--modal-header-bg);
      flex-shrink: 0;
    }

    /* All Interactive Modal Elements must be clickable */
    .modal-dialog button,
    .modal-dialog input,
    .modal-dialog select,
    .modal-dialog textarea,
    .modal-dialog a {
      pointer-events: auto !important;
      cursor: pointer;
    }

    /* Universal Graphics Workspace Theme Overrides */
    #termViewGraphics,
    #termViewTurtle {
      background: var(--graphics-panel-bg) !important;
      color: var(--text-main);
    }

    .graphics-header-bar,
    .turtle-header-bar {
      background: var(--graphics-toolbar-bg) !important;
      border-bottom: 1px solid var(--graphics-viewport-border) !important;
    }

    .graphics-viewport,
    .turtle-viewport {
      background: var(--graphics-viewport-bg) !important;
      border: 1px solid var(--graphics-viewport-border);
    }

    .graphics-placeholder {
      background: var(--graphics-viewport-bg) !important;
    }

    .graphics-placeholder-card {
      background: var(--graphics-card-bg) !important;
      border: 1px solid var(--graphics-card-border) !important;
      box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.4) !important;
      color: var(--text-main) !important;
    }

    .btn-graphics-preset {
      background: var(--graphics-preset-bg) !important;
      border: 1px solid var(--graphics-preset-border) !important;
      color: var(--text-main) !important;
    }
    .btn-graphics-preset:hover {
      background: var(--hover-light) !important;
      border-color: var(--primary-blue) !important;
      transform: translateY(-2px);
    }

    .btn-graphics-tool {
      background: var(--graphics-tool-bg) !important;
      border: 1px solid var(--graphics-tool-border) !important;
      color: var(--graphics-tool-text) !important;
    }
    .btn-graphics-tool:hover {
      border-color: var(--primary-blue) !important;
      color: var(--primary-blue) !important;
    }
    .btn-graphics-tool.primary {
      background: var(--primary-gradient) !important;
      color: #ffffff !important;
      border-color: transparent !important;
    }
    .btn-graphics-tool.primary:hover {
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(0, 102, 255, 0.35) !important;
    }
    .btn-graphics-tool.danger:hover {
      color: #ef4444 !important;
      border-color: rgba(239, 68, 68, 0.4) !important;
    }

    .graphics-select-dropdown {
      background: var(--graphics-tool-bg) !important;
      color: var(--graphics-tool-text) !important;
      border: 1px solid var(--graphics-tool-border) !important;
    }

    /* Theme Modal Custom Option Cards */
    .theme-selection-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .theme-modal-card {
      border: 2px solid var(--card-border-subtle);
      border-radius: var(--radius-card);
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--card-bg-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
    }
    .theme-modal-card:hover {
      border-color: var(--primary-blue);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 102, 255, 0.15);
    }
    .theme-modal-card.active {
      border-color: var(--primary-blue);
      background: rgba(0, 102, 255, 0.08);
      box-shadow: 0 0 0 1px var(--primary-blue), 0 8px 24px rgba(0, 102, 255, 0.18);
    }
    .theme-modal-preview {
      height: 75px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }
    .theme-preview-light {
      background: #eaf2fd;
      color: #0f172a;
    }
    .theme-preview-dark {
      background: #070d18;
      color: #f8fafc;
    }
    .theme-modal-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .theme-modal-desc {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.35;
    }
    .theme-active-tag {
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--primary-blue);
      color: #ffffff;
      display: none;
    }
    .theme-modal-card.active .theme-active-tag {
      display: inline-block;
    }

    /* Preferences Dialog Form Rows */
    .pref-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--modal-dialog-border);
      gap: 16px;
    }
    .pref-row:last-child {
      border-bottom: none;
    }
    .pref-info h5 {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      margin: 0 0 2px 0;
    }
    .pref-info p {
      font-size: 11px;
      color: var(--text-muted);
      margin: 0;
    }
`;

// Insert masterThemeCSS before </style>
const styleCloseIdx = html.indexOf('</style>');
if (styleCloseIdx !== -1 && !html.includes('MASTER OVERHAUL: UNIFIED GRAPHICS & MODAL ARCHITECTURE')) {
  html = html.slice(0, styleCloseIdx) + '\n' + masterThemeCSS + '\n' + html.slice(styleCloseIdx);
  console.log('Appended Master Overhaul CSS before </style>');
}

// =========================================================================
// 2. SYNCHRONIZE SETTINGS SECTION THEME PICKER (2 Official Themes)
// =========================================================================
const settingsOldPicker = `<div class="theme-picker-group">
                  <div class="theme-card-option active" data-theme="light">Light Glass</div>
                  <div class="theme-card-option" data-theme="dark">Cyber Obsidian</div>
                  <div class="theme-card-option" data-theme="midnight">Midnight Cobalt</div>
                </div>`;

const settingsNewPicker = `<div class="theme-picker-group" id="settingsThemePickerGroup">
                  <div class="theme-card-option" data-theme="glass-light" id="themeOptGlassLight">
                    <span style="font-weight:700;">☀️ Glass Light</span>
                    <span style="font-size:10.5px; opacity:0.8; margin-top:2px;">Light Frosted Glassmorphism</span>
                  </div>
                  <div class="theme-card-option" data-theme="crystal-obsidian" id="themeOptCrystalObsidian">
                    <span style="font-weight:700;">🌙 Crystal Obsidian</span>
                    <span style="font-size:10.5px; opacity:0.8; margin-top:2px;">Dark Obsidian Glassmorphism</span>
                  </div>
                </div>`;

if (html.includes(settingsOldPicker)) {
  html = html.replace(settingsOldPicker, settingsNewPicker);
  console.log('Synchronized Settings theme selector with 2 official themes (Glass Light & Crystal Obsidian)');
}

// =========================================================================
// 3. ADD MODALS: modalPreferences & modalThemes INSIDE #nrgOverlayLayer
// =========================================================================

const preferencesModalHTML = `
    <!-- 5. Developer Preferences Modal -->
    <div class="modal-overlay" id="modalPreferences" role="dialog" aria-modal="true">
      <div class="modal-dialog" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Developer Preferences</span>
          </h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnClosePreferencesModal" title="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="pref-row">
            <div class="pref-info">
              <h5>Editor Font Size</h5>
              <p>Adjust editor code typography scale</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="range" id="prefFontSize" min="12" max="20" step="0.5" value="14.5" style="width:100px;">
              <span id="prefFontSizeVal" style="font-family:var(--font-mono); font-size:12px; font-weight:700; width:34px;">14.5px</span>
            </div>
          </div>
          <div class="pref-row">
            <div class="pref-info">
              <h5>Tab Indentation</h5>
              <p>Spaces per indent level</p>
            </div>
            <select class="form-input" id="prefTabSize" style="width:100px; padding:4px 8px;">
              <option value="2">2 spaces</option>
              <option value="4" selected>4 spaces</option>
              <option value="8">8 spaces</option>
            </select>
          </div>
          <div class="pref-row">
            <div class="pref-info">
              <h5>Word Wrapping</h5>
              <p>Wrap long source lines in viewport</p>
            </div>
            <label class="switch-toggle" style="position:relative; display:inline-block; width:36px; height:20px;">
              <input type="checkbox" id="prefWordWrap" style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; inset:0; background:rgba(0,0,0,0.2); border-radius:20px; transition:.2s;"></span>
            </label>
          </div>
          <div class="pref-row">
            <div class="pref-info">
              <h5>Auto-Indentation</h5>
              <p>Automatically match indent on newline</p>
            </div>
            <label class="switch-toggle" style="position:relative; display:inline-block; width:36px; height:20px;">
              <input type="checkbox" id="prefAutoIndent" checked style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; inset:0; background:var(--primary-blue); border-radius:20px; transition:.2s;"></span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="glass-btn" id="btnCancelPreferencesModal">Cancel</button>
          <button class="glass-btn glass-btn-primary" id="btnSavePreferencesModal">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- 6. Theme Selection Modal -->
    <div class="modal-overlay" id="modalThemes" role="dialog" aria-modal="true">
      <div class="modal-dialog" style="max-width:540px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <span>Appearance & Theme Architecture</span>
          </h3>
          <button class="nav-btn" style="width:30px; height:30px;" id="btnCloseThemeModal" title="Close">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px; line-height:1.45;">
            Select an official NRG Engine aesthetic. Changes immediately synchronize across all workspaces, editors, dialogs, and the graphics execution engine.
          </p>

          <div class="theme-selection-grid">
            <!-- Glass Light -->
            <div class="theme-modal-card" id="themeCardLight" data-theme="glass-light">
              <div class="theme-modal-preview theme-preview-light">
                <div style="height:16px; background:#dbeafe; border-bottom:1px solid #bfdbfe; display:flex; align-items:center; padding:0 6px; gap:4px;">
                  <span style="width:6px; height:6px; border-radius:50%; background:#ef4444;"></span>
                  <span style="width:6px; height:6px; border-radius:50%; background:#f59e0b;"></span>
                  <span style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                </div>
                <div style="padding:6px; font-size:9.5px; font-family:monospace; color:#0f172a;">
                  <div>printf("Glass Light");</div>
                </div>
              </div>
              <div>
                <div class="theme-modal-title">
                  <span>Glass Light</span>
                  <span class="theme-active-tag">ACTIVE</span>
                </div>
                <div class="theme-modal-desc">Frosted light glassmorphic surface with high-contrast slate typography.</div>
              </div>
            </div>

            <!-- Crystal Obsidian -->
            <div class="theme-modal-card" id="themeCardDark" data-theme="crystal-obsidian">
              <div class="theme-modal-preview theme-preview-dark">
                <div style="height:16px; background:#070d18; border-bottom:1px solid rgba(56,189,248,0.2); display:flex; align-items:center; padding:0 6px; gap:4px;">
                  <span style="width:6px; height:6px; border-radius:50%; background:#ef4444;"></span>
                  <span style="width:6px; height:6px; border-radius:50%; background:#f59e0b;"></span>
                  <span style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                </div>
                <div style="padding:6px; font-size:9.5px; font-family:monospace; color:#38bdf8;">
                  <div>printf("Crystal Obsidian");</div>
                </div>
              </div>
              <div>
                <div class="theme-modal-title">
                  <span>Crystal Obsidian</span>
                  <span class="theme-active-tag">ACTIVE</span>
                </div>
                <div class="theme-modal-desc">Deep cyber obsidian glass with electric cyan accents and zero glare.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="glass-btn" id="btnCancelThemeModal">Close</button>
          <button class="glass-btn glass-btn-primary" id="btnDoneThemeModal">Done</button>
        </div>
      </div>
    </div>
`;

// Insert the two new modals inside #nrgOverlayLayer before its closing </div>
const overlayCloseIdx = html.indexOf('</div>\n  </div>\n\n  <!-- ================================================================');
if (overlayCloseIdx !== -1 && !html.includes('id="modalPreferences"')) {
  html = html.slice(0, overlayCloseIdx) + preferencesModalHTML + '\n  ' + html.slice(overlayCloseIdx);
  console.log('Inserted modalPreferences and modalThemes into #nrgOverlayLayer');
} else if (!html.includes('id="modalPreferences"')) {
  // Try inserting before </body>
  const bodyClose = html.lastIndexOf('</body>');
  html = html.slice(0, bodyClose) + preferencesModalHTML + '\n' + html.slice(bodyClose);
  console.log('Inserted modalPreferences and modalThemes before </body>');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Saved modal HTML additions');
