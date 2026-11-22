const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const mIdx = html.indexOf('btnCloseAccountModal');
console.log('btnCloseAccountModal at:', mIdx);
if (mIdx !== -1) {
  let pos = mIdx;
  while ((pos = html.indexOf('btnCloseAccountModal', pos + 1)) !== -1) {
    console.log('Match at', pos, ':\n', html.slice(pos - 50, pos + 250));
  }
}

// Let's search for modal-overlay CSS
const moIdx = html.indexOf('.modal-overlay {');
console.log('--- .modal-overlay CSS ---');
if (moIdx !== -1) {
  console.log(html.slice(moIdx - 50, moIdx + 500));
}
