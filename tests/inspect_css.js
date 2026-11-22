const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');

console.log('Style length in characters:', styleEnd - styleStart);
console.log('Top 1500 chars of CSS:');
console.log(html.slice(styleStart, styleStart + 1500));
