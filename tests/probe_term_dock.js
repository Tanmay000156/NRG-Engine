const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const gStart = html.indexOf('terminal-tab-btn');
console.log(html.slice(gStart - 600, gStart));
