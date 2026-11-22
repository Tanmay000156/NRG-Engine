const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

let pos = 0;
const modals = [];
while ((pos = html.indexOf('class="modal-overlay', pos + 1)) !== -1) {
  modals.push(html.slice(pos - 10, pos + 150));
}
console.log('--- ALL MODAL OVERLAYS FOUND ---', modals);

// Let's also check paletteModal and overviewModal
console.log('paletteModal:', html.includes('id="paletteModal"'));
console.log('overviewModal:', html.includes('id="overviewModal"'));
console.log('projectModal:', html.includes('id="projectModal"'));
console.log('snippetModal:', html.includes('id="snippetModal"'));
console.log('templateModal:', html.includes('id="templateModal"'));
