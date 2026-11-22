const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const pIdx = html.indexOf('Problems (0)');
console.log('Problems (0) at:', pIdx);
if (pIdx !== -1) {
  console.log(html.slice(pIdx - 400, pIdx + 600));
}
