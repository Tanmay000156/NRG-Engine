const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const tIdx = html.indexOf('const TEMPLATES_CATALOG = [');
const tClose = html.indexOf('];\n\n    let currentTemplateFilter =', tIdx);
console.log('tClose with let currentTemplateFilter:', tClose);
if (tClose === -1) {
  // Let's find ]; following TEMPLATES_CATALOG
  const nextBracket = html.indexOf('];', tIdx);
  console.log('Next ]; snippet:\n', html.slice(nextBracket - 50, nextBracket + 150));
}
