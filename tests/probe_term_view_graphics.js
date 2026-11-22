const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const gStart = html.indexOf('id="termViewGraphics"');
const gEnd = html.indexOf('</div>\n          </div>', gStart + 500);
console.log(html.slice(gStart, gStart + 6000));
