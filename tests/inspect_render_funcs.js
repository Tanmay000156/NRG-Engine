const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

function findFunction(name) {
  const idx = html.indexOf(`function ${name}`);
  if (idx !== -1) {
    console.log(`=== ${name} ===`);
    console.log(html.slice(idx, idx + 2500));
  }
}

findFunction('renderTemplatesSection');
findFunction('renderProjectsSection');
findFunction('renderSnippetsSection');
