const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

function findOccurrences(str, target) {
  let idx = 0;
  const results = [];
  while ((idx = str.indexOf(target, idx)) !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(str.length, idx + 200);
    results.push({ idx, snippet: str.slice(start, end) });
    idx += target.length;
  }
  return results;
}

console.log('--- btnClosePreferencesModal occurrences ---');
findOccurrences(html, 'btnClosePreferencesModal').forEach(o => console.log(o.snippet, '\n---\n'));

console.log('--- btnThemeToggle occurrences ---');
findOccurrences(html, 'btnThemeToggle').forEach(o => console.log(o.snippet, '\n---\n'));
