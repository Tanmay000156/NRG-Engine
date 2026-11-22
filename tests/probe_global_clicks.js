const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

let pos = 0;
while ((pos = html.indexOf("window.addEventListener('click'", pos + 1)) !== -1) {
  console.log('window click at', pos, ':\n', html.slice(pos - 20, pos + 250));
}
let pos2 = 0;
while ((pos2 = html.indexOf("document.addEventListener('click'", pos2 + 1)) !== -1) {
  console.log('document click at', pos2, ':\n', html.slice(pos2 - 20, pos2 + 250));
}
