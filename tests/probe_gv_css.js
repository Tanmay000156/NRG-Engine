const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const gvIdx = html.indexOf('.graphics-viewport,');
console.log(html.slice(gvIdx, gvIdx + 1200));
