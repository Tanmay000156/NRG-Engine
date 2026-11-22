const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const tStart = html.indexOf('function toggleAppTheme()');
console.log('--- toggleAppTheme BLOCK ---');
console.log(html.slice(tStart, tStart + 1500));
