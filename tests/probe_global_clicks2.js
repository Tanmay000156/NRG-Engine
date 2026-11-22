const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log(html.slice(1815577 - 100, 1815577 + 600));
