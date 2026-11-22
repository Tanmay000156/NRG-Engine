const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const tIdx = html.indexOf('class BrowserTurtleEngine');
const tIdx2 = html.indexOf('nrgTurtleEngine');
console.log({ tIdx, tIdx2 });
if (tIdx !== -1) console.log(html.slice(tIdx, tIdx + 1500));
else if (tIdx2 !== -1) console.log(html.slice(tIdx2, tIdx2 + 1500));
