const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const tmplIdx = html.indexOf('const TEMPLATES_CATALOG =');
if (tmplIdx !== -1) {
  console.log('TEMPLATES_CATALOG:\n', html.slice(tmplIdx, tmplIdx + 1200));
}

const langIdx = html.indexOf('const LANGUAGES =');
if (langIdx !== -1) {
  console.log('LANGUAGES:\n', html.slice(langIdx, langIdx + 1200));
}
