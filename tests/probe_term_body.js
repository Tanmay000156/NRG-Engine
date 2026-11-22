const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const tbIdx = html.indexOf('.terminal-body {');
console.log(html.slice(tbIdx - 50, tbIdx + 300));
