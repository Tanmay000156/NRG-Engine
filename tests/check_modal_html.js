const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

const idx = content.indexOf('modalCreateProject');
console.log(content.substring(idx - 100, idx + 800));

// Also find its CSS
const cssIdx = content.indexOf('.modal');
console.log('--- Modal CSS ---');
console.log(content.substring(cssIdx, cssIdx + 800));
