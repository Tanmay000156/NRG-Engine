const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const idx = html.indexOf('modalAccountProfile');
if (idx !== -1) {
  let cur = idx;
  while ((cur = html.indexOf('modalAccountProfile', cur + 1)) !== -1) {
    console.log('Match at', cur, ':\n', html.slice(cur - 40, cur + 400), '\n---');
  }
}
