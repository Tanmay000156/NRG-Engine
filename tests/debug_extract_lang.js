const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const idx = html.indexOf('const LANGUAGES =');
console.log(html.slice(idx, idx + 600));

const tmplIdx = html.indexOf('const TEMPLATES_CATALOG =');
console.log('--- TEMPLATES_CATALOG ---');
console.log(html.slice(tmplIdx, tmplIdx + 600));
