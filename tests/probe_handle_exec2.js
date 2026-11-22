const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const hIdx = html.indexOf('Case 3: Runtime Error');
console.log(html.slice(hIdx, hIdx + 4000));
