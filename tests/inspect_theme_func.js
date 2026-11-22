const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

function findFunction(name) {
  const idx = html.indexOf(name);
  if (idx === -1) return null;
  return html.slice(Math.max(0, idx - 50), Math.min(html.length, idx + 1000));
}

console.log('--- toggleAppTheme ---');
console.log(findFunction('function toggleAppTheme'));

console.log('--- profile menu listeners ---');
const pmenuIdx = html.indexOf('pmenu');
if (pmenuIdx !== -1) {
  console.log(html.slice(pmenuIdx - 50, pmenuIdx + 1500));
} else {
  console.log('No pmenu found in js');
}
