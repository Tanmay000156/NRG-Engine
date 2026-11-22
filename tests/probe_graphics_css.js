const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const classes = [
  'graphics-viewport',
  'graphics-placeholder',
  'graphics-placeholder-card',
  'btn-graphics-preset',
  'graphics-header-bar',
  'btn-graphics-tool',
  'graphics-select-dropdown',
  '#termViewGraphics',
  '#graphicsCanvas'
];

for (const c of classes) {
  let idx = 0;
  console.log(`=== CSS SEARCH: ${c} ===`);
  while ((idx = html.indexOf(c, idx + 1)) !== -1) {
    if (idx < 100000) { // in <style>
      console.log(html.slice(idx - 20, idx + 200));
    }
  }
}
