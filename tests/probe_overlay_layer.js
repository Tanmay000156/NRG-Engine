const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const oIdx = html.indexOf('.nrg-overlay-layer');
console.log(html.slice(oIdx - 50, oIdx + 500));
