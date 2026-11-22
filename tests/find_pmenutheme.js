const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const regex = /pmenuTheme/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(html.length, match.index + 200);
  console.log('Match at', match.index, ':\n', html.slice(start, end), '\n---');
}
