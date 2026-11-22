const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const tIdx = html.indexOf('class NRGTurtleEngine');
console.log(html.slice(tIdx, tIdx + 2000));
