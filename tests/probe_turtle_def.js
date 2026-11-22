const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

let pos = 0;
while ((pos = html.indexOf('nrgTurtleEngine', pos + 1)) !== -1) {
  console.log('Match at', pos, ':\n', html.slice(pos - 40, pos + 100));
}
