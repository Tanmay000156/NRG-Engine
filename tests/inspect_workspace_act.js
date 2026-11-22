const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const actIdx = html.indexOf('function trackWorkspaceActivity');
if (actIdx !== -1) {
  console.log('trackWorkspaceActivity:\n', html.slice(actIdx, actIdx + 800));
}

const wIdx = html.indexOf('let workspaceState =');
if (wIdx !== -1) {
  console.log('workspaceState:\n', html.slice(wIdx, wIdx + 500));
}
