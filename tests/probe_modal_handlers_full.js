const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log(html.slice(1811188 - 500, 1811188 + 3000));
