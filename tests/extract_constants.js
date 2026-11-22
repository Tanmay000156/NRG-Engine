const fs = require('fs');
const path = require('path');

const legacyPath = path.resolve(__dirname, '../index.legacy.html');
const html = fs.readFileSync(legacyPath, 'utf8');

const constDir = path.resolve(__dirname, '../src/constants');
if (!fs.existsSync(constDir)) {
  fs.mkdirSync(constDir, { recursive: true });
}

// 1. LANGUAGES
const langStart = html.indexOf('const LANGUAGES = {');
const langEnd = html.indexOf('};\n\n    let currentLanguage =', langStart);
const langObj = html.slice(langStart, langEnd + 1);

fs.writeFileSync(path.join(constDir, 'languages.js'), `// NRG ENGINE 2.0 — Supported Languages Catalog\nexport ${langObj};\n`, 'utf8');
console.log('Saved src/constants/languages.js');

// 2. TEMPLATES_CATALOG
const tmplStart = html.indexOf('const TEMPLATES_CATALOG = [');
const tmplEnd = html.indexOf('];\n\n    let currentTemplateFilter =', tmplStart);
const tmplObj = html.slice(tmplStart, tmplEnd + 1);

fs.writeFileSync(path.join(constDir, 'templates.js'), `// NRG ENGINE 2.0 — Starter Templates Catalog\nexport ${tmplObj};\n`, 'utf8');
console.log('Saved src/constants/templates.js');
