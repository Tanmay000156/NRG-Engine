const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const gBtn = html.indexOf('tabBtnGraphics');
console.log('tabBtnGraphics at:', gBtn);
// Search for data-tab-panel or similar or id="paneGraphics" or id="graphics"
const p1 = html.indexOf('id="termTabGraphics"', gBtn);
const p2 = html.indexOf('id="tabPanelGraphics"', gBtn);
const p3 = html.indexOf('id="graphicsTab"', gBtn);
const p4 = html.indexOf('id="graphicsWorkspace"', gBtn);
const p5 = html.indexOf('data-panel="graphics"', gBtn);
const p6 = html.indexOf('data-term-panel="graphics"', gBtn);
console.log({ p1, p2, p3, p4, p5, p6 });

// Let's search after the terminal controls closing div
const termBody = html.indexOf('class="terminal-body"', gBtn);
if (termBody !== -1) {
  console.log('--- TERMINAL BODY ---');
  console.log(html.slice(termBody, termBody + 4000));
}
