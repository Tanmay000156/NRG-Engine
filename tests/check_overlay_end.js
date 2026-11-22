const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const overlayLayerIdx = html.indexOf('class="nrg-overlay-layer"');
console.log(html.slice(overlayLayerIdx, overlayLayerIdx + 500));

// Find modalSignOutConfirm
const signoutIdx = html.indexOf('id="modalSignOutConfirm"');
console.log('--- Around modalSignOutConfirm ---');
console.log(html.slice(signoutIdx, signoutIdx + 1200));
