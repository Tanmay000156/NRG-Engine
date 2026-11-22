const fs = require('fs');
const path = require('path');

const legacyPath = path.resolve(__dirname, '../index.legacy.html');
const html = fs.readFileSync(legacyPath, 'utf8');

const styleStart = html.indexOf('<style>') + '<style>'.length;
const styleEnd = html.indexOf('</style>');

const fullCSS = html.slice(styleStart, styleEnd);
console.log('Total extracted CSS length:', fullCSS.length);

const stylesDir = path.resolve(__dirname, '../src/styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

// Write the complete unified CSS to src/styles/global.css
fs.writeFileSync(path.join(stylesDir, 'global.css'), fullCSS, 'utf8');
console.log('Successfully written src/styles/global.css');
