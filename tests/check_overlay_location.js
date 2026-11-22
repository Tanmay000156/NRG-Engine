const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const accountModalIdx = html.indexOf('id="modalAccountProfile"');
const shortcutsModalIdx = html.indexOf('id="modalKeyboardShortcuts"');
const overlayLayerIdx = html.indexOf('class="nrg-overlay-layer"');

console.log('overlayLayerIdx:', overlayLayerIdx);
console.log('accountModalIdx:', accountModalIdx);
console.log('shortcutsModalIdx:', shortcutsModalIdx);
