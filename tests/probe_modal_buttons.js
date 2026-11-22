const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const modals = [
  'modalCreateProject',
  'modalCreateSnippet',
  'overviewModal',
  'paletteModal'
];

for (const m of modals) {
  const idx = html.indexOf(`id="${m}"`);
  if (idx !== -1) {
    const end = html.indexOf('</div>\n  </div>', idx);
    console.log(`=== MODAL: ${m} ===`);
    console.log(html.slice(idx, (end !== -1 ? end + 15 : idx + 1000)));
  }
}
