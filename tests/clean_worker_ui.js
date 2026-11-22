const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove CSS for .worker-status-badge
const cssStartMarker = '    /* Dedicated Interactive Worker Status Pill */\r\n';
const cssEndMarker = '    @keyframes workerPulse {\r\n      0%, 100% { opacity: 1; transform: scale(1); }\r\n      50% { opacity: 0.35; transform: scale(0.85); }\r\n    }\r\n';

const idxCssStart = content.indexOf(cssStartMarker);
const idxCssEnd = content.indexOf(cssEndMarker, idxCssStart);

if (idxCssStart !== -1 && idxCssEnd !== -1) {
  content = content.slice(0, idxCssStart) + content.slice(idxCssEnd + cssEndMarker.length);
  console.log('✔ CSS .worker-status-badge removed successfully');
} else {
  console.error('❌ Failed to locate CSS markers:', { idxCssStart, idxCssEnd });
}

// 2. Remove HTML badge from .terminal-controls
const htmlBadgeSnippet = '              <!-- Dedicated Interactive Worker Status Pill -->\r\n' +
'              <span class="worker-status-badge offline" id="workerStatusBadge" title="Interactive Execution Worker: Click to configure endpoint">\r\n' +
'                <span class="worker-pulse-dot" id="workerPulseDot"></span>\r\n' +
'                <span id="workerStatusText">Worker Offline</span>\r\n' +
'              </span>\r\n\r\n';

const idxHtml = content.indexOf(htmlBadgeSnippet);
if (idxHtml !== -1) {
  content = content.replace(htmlBadgeSnippet, '');
  console.log('✔ HTML #workerStatusBadge removed successfully');
} else {
  console.error('❌ Failed to locate HTML badge snippet');
}

// 3. Remove updateWorkerStatusUI, modal handlers, and polling timers
const jsStartMarker = '    function updateWorkerStatusUI(isOnline, statusDesc, currentUrl) {';
const jsEndMarker = '      setInterval(checkWorkerHealth, 30000);\r\n    });';

const idxJsStart = content.indexOf(jsStartMarker);
const idxJsEnd = content.indexOf(jsEndMarker, idxJsStart);

if (idxJsStart !== -1 && idxJsEnd !== -1) {
  const replacementJs = 
`    function updateWorkerStatusUI() {
      // Persistent worker status pill removed from toolbar per design directive
    }

    async function checkWorkerHealth() {
      try {
        const workerUrl = getInteractiveWorkerUrl();
        const httpUrl = workerUrl
          .replace(/^wss:/i, 'https:')
          .replace(/^ws:/i, 'http:')
          .replace(/\\/ws$/i, '/health')
          .replace(/\\/api\\/interactive\\/ws$/i, '/health');
        const res = await fetch(httpUrl, { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return !!(data.status === 'ok' || data.service || data.status === 'online');
        }
      } catch (e) {}
      return false;
    }`;

  content = content.slice(0, idxJsStart) + replacementJs + content.slice(idxJsEnd + jsEndMarker.length);
  console.log('✔ JS worker status UI & background polling removed successfully');
} else {
  console.error('❌ Failed to locate JS worker UI markers:', { idxJsStart, idxJsEnd });
}

// 4. Update error handling inside handleInteractiveError
const oldErrorState = "          terminalStatusBadge.className = 'terminal-status-badge error';\r\n" +
"          terminalStatusText.textContent = 'Worker Offline';";

const newErrorState = "          terminalStatusBadge.className = 'terminal-status-badge error';\r\n" +
"          terminalStatusText.textContent = 'Connection Error';";

if (content.includes(oldErrorState)) {
  content = content.replace(oldErrorState, newErrorState);
  console.log('✔ handleInteractiveError status text updated to Connection Error');
} else {
  console.error('❌ Failed to locate oldErrorState');
}

const oldResetCall = "          if (stdoutView) stdoutView.textContent = '[Interactive Worker Offline]\\n' + errMsg;\r\n" +
"          resetInteractiveUI('Worker Offline', 1);";

const newResetCall = "          if (stdoutView) stdoutView.textContent = '[Connection Error]\\n' + errMsg;\r\n" +
"          resetInteractiveUI('Connection Error', 1);";

if (content.includes(oldResetCall)) {
  content = content.replace(oldResetCall, newResetCall);
  console.log('✔ handleInteractiveError reset UI updated to Connection Error');
} else {
  console.error('❌ Failed to locate oldResetCall');
}

// 5. Remove modalWorkerConfig from bottom of body
const modalStartMarker = '  <!-- Worker Configuration Modal -->\r\n  <div class="modal-backdrop" id="modalWorkerConfig"';
const modalEndMarker = '    </div>\r\n  </div>\r\n</body>';

const idxModalStart = content.indexOf(modalStartMarker);
const idxModalEnd = content.indexOf(modalEndMarker, idxModalStart);

if (idxModalStart !== -1 && idxModalEnd !== -1) {
  content = content.slice(0, idxModalStart) + '</body>' + content.slice(idxModalEnd + modalEndMarker.length);
  console.log('✔ modalWorkerConfig removed successfully');
} else {
  console.error('❌ Failed to locate modalWorkerConfig markers:', { idxModalStart, idxModalEnd });
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated index.html written successfully.');
