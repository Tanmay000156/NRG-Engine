const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const idx = html.indexOf('function toggleAppTheme');
if (idx !== -1) {
  console.log('Snippet around toggleAppTheme:');
  console.log(html.slice(idx - 100, idx + 600));
} else {
  console.log('toggleAppTheme not found!');
}
