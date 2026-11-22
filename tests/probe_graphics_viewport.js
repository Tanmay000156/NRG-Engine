const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const vIdx = html.indexOf('id="graphicsViewport"');
console.log(html.slice(vIdx, vIdx + 3000));
