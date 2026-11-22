const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const eIdx = html.indexOf('function executeRealCode()');
const endIdx = html.indexOf('function ', eIdx + 50);
console.log(html.slice(eIdx + 1500, eIdx + 4500));
