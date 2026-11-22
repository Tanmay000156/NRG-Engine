const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const pIdx = html.indexOf('function loadGraphicsPreset');
console.log(html.slice(pIdx, pIdx + 1500));
