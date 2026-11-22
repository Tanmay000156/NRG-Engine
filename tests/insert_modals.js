const fs = require('fs');
const path = require('path');
const indexPath = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

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

if (!html.includes('id="modalAccountProfile"')) {
  // Find </button>\n      </div>\n    </div>\n  </div>
  const searchPattern = `<span>Sign Out</span>\n        </button>\n      </div>\n    </div>\n  </div>`;
  const normHtml = html.replace(/\r\n/g, '\n');
  if (normHtml.includes(searchPattern)) {
    const replacement = `<span>Sign Out</span>\n        </button>\n      </div>\n    </div>\n${modalsHTML}\n  </div>`;
    const updated = normHtml.replace(searchPattern, replacement);
    fs.writeFileSync(indexPath, updated, 'utf8');
    console.log('Inserted 4 modals inside nrgOverlayLayer!');
  } else {
    console.log('Search pattern not matched, inserting before last </div> in nrgOverlayLayer:');
    const start = normHtml.indexOf('nrgOverlayLayer');
    const script = normHtml.indexOf('<script', start);
    const lastDiv = normHtml.lastIndexOf('</div>', script);
    const updated = normHtml.slice(0, lastDiv) + modalsHTML + '\n  ' + normHtml.slice(lastDiv);
    fs.writeFileSync(indexPath, updated, 'utf8');
    console.log('Inserted modals before last div of nrgOverlayLayer!');
  }
} else {
  console.log('Modals already present!');
}
