const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const idx = html.indexOf('class NRGTurtleEngine');
if (idx !== -1) {
  console.log(html.slice(idx, idx + 2000));
} else {
  console.log('NRGTurtleEngine not found');
}
