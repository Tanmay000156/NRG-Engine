const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const rIdx = html.indexOf('btnGraphicsRun');
console.log('btnGraphicsRun at:', rIdx);
if (rIdx !== -1) {
  // Let's find event listener in script
  let pos = rIdx;
  while ((pos = html.indexOf('btnGraphicsRun', pos + 1)) !== -1) {
    console.log('Match at', pos, ':\n', html.slice(pos - 50, pos + 300));
  }
}
