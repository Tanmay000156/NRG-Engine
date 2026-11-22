const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const vars = [
  '--graphics-panel-bg',
  '--graphics-viewport-bg',
  '--graphics-toolbar-bg',
  '--graphics-card-bg',
  '--graphics-card-border',
  '--graphics-preset-bg',
  '--graphics-preset-border',
  '--graphics-tool-bg',
  '--graphics-tool-border',
  '--graphics-tool-text',
  '--modal-overlay-bg',
  '--modal-dialog-bg',
  '--modal-dialog-border',
  '--modal-dialog-shadow',
  '--modal-header-bg'
];

for (const v of vars) {
  const count = (html.match(new RegExp(v, 'g')) || []).length;
  console.log(`${v}: ${count} references`);
}
