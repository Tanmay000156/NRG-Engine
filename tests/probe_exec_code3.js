const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const eIdx = html.indexOf('function executeRealCode()');
console.log(html.slice(eIdx + 4500, eIdx + 8000));
