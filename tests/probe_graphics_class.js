const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log(html.slice(1757120 - 2000, 1757120 + 2000));
