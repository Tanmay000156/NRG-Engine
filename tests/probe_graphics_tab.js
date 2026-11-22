const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// Find all occurrences of dock tabs
const dockIdx = html.indexOf('class="terminal-dock-tabs"');
if (dockIdx !== -1) {
  console.log('--- DOCK TABS ---');
  console.log(html.slice(dockIdx, dockIdx + 1200));
}

// Find all occurrences of "Graphics" or "Turtle" in dock
const tabIdx = html.indexOf('data-tab="');
let pos = 0;
while ((pos = html.indexOf('data-tab="', pos + 1)) !== -1) {
  console.log('data-tab match:', html.slice(pos, pos + 100));
}
