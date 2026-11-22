const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// 1. Inspect #termViewGraphics HTML
const gStart = html.indexOf('id="termViewGraphics"');
const gEnd = html.indexOf('<!-- Tab ', gStart);
console.log('--- #termViewGraphics HTML ---');
console.log(html.slice(gStart, gStart + 3500));

// 2. Search CSS for termViewGraphics and graphics
const cssMatches = [];
let pos = 0;
while ((pos = html.indexOf('termViewGraphics', pos + 1)) !== -1) {
  if (pos < gStart) { // in style
    cssMatches.push(html.slice(pos - 50, pos + 250));
  }
}
console.log('--- CSS MATCHES FOR termViewGraphics ---', cssMatches);

// Search for .graphics-workspace or .graphics-container or similar
let pos2 = 0;
const graphCss = [];
while ((pos2 = html.indexOf('.graphics-', pos2 + 1)) !== -1) {
  if (pos2 < gStart) {
    graphCss.push(html.slice(pos2, pos2 + 150));
  }
}
console.log('--- FIRST 10 GRAPHICS CSS CLASSES ---', graphCss.slice(0, 10));
