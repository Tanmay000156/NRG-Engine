const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const idx = html.indexOf('function loadGraphicsPreset(type)');
console.log(html.slice(idx, idx + 2500));
