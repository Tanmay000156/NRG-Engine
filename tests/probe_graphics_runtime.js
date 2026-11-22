const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// 1. Search for btn-graphics-preset CSS
const pIdx = html.indexOf('.btn-graphics-preset {');
console.log('--- .btn-graphics-preset CSS ---');
console.log(html.slice(pIdx - 100, pIdx + 600));

// 2. Search for terminal pane background
const tIdx = html.indexOf('.terminal-pane');
console.log('--- .terminal-pane CSS ---');
console.log(html.slice(tIdx - 50, tIdx + 400));

// 3. Search for Graphics Engine in JS
const geIdx = html.indexOf('class UniversalGraphicsEngine');
const geIdx2 = html.indexOf('const GraphicsEngine');
const geIdx3 = html.indexOf('universalGraphics');
console.log({ geIdx, geIdx2, geIdx3 });
if (geIdx !== -1) console.log(html.slice(geIdx, geIdx + 2000));
