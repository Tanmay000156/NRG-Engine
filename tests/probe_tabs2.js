const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const pIdx = html.indexOf('Problems (0)');
console.log(html.slice(pIdx - 2500, pIdx));
