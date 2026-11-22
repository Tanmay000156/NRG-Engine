const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const langStart = html.indexOf('const LANGUAGES = {');
const nextVar = html.indexOf('let currentLanguage =', langStart);
const langBlock = html.slice(langStart, nextVar).trim();

console.log('langBlock length:', langBlock.length);
console.log('tail:', langBlock.slice(-100));

fs.writeFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/src/constants/languages.js', `// NRG ENGINE 2.0 — Supported Languages Catalog\nexport ${langBlock}\n`, 'utf8');

const tmplStart = html.indexOf('const TEMPLATES_CATALOG = [');
const nextTmplVar = html.indexOf('let currentTemplateFilter =', tmplStart);
const tmplBlock = html.slice(tmplStart, nextTmplVar).trim();

console.log('tmplBlock length:', tmplBlock.length);
console.log('tail:', tmplBlock.slice(-100));

fs.writeFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/src/constants/templates.js', `// NRG ENGINE 2.0 — Starter Templates Catalog\nexport ${tmplBlock}\n`, 'utf8');
console.log('Done writing languages and templates');
