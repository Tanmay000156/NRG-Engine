const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

// 1. LANGUAGES
const langStart = html.indexOf('const LANGUAGES = {');
const kotlinIdx = html.indexOf('kotlin: {');
const langClose = kotlinIdx + html.slice(kotlinIdx).indexOf('};');
const langBlock = html.slice(langStart, langClose + 2).trim();

fs.writeFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/src/constants/languages.js', `// NRG ENGINE 2.0 — Supported Languages Catalog\nexport ${langBlock};\n`, 'utf8');
console.log('Successfully wrote src/constants/languages.js (chars:', langBlock.length, ')');

// 2. TEMPLATES_CATALOG
const tmplStart = html.indexOf('const TEMPLATES_CATALOG = [');
const t10Idx = html.indexOf("id: 't10'");
const tmplClose = html.indexOf('];', t10Idx);
const tmplBlock = html.slice(tmplStart, tmplClose + 2).trim();

fs.writeFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/src/constants/templates.js', `// NRG ENGINE 2.0 — Starter Templates Catalog\nexport ${tmplBlock};\n`, 'utf8');
console.log('Successfully wrote src/constants/templates.js (chars:', tmplBlock.length, ')');
