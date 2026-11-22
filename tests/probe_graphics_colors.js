const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

let pos = 0;
while ((pos = html.indexOf('--card-bg-solid', pos + 1)) !== -1) {
  console.log('Match at', pos, ':\n', html.slice(pos - 40, pos + 120));
}

// Let's also search for the canvas viewport background and empty state
const vIdx = html.indexOf('class="graphics-canvas-container"');
const vIdx2 = html.indexOf('class="turtle-canvas-container"');
const vIdx3 = html.indexOf('graphics-welcome-card');
console.log({ vIdx, vIdx2, vIdx3 });
if (vIdx !== -1) console.log(html.slice(vIdx - 50, vIdx + 600));
if (vIdx2 !== -1) console.log(html.slice(vIdx2 - 50, vIdx2 + 600));
if (vIdx3 !== -1) console.log(html.slice(vIdx3 - 50, vIdx3 + 600));
