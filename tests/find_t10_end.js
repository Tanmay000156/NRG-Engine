const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const t10Idx = html.indexOf("id: 't10'");
const closeIdx = html.indexOf('];', t10Idx);
console.log(html.slice(closeIdx - 50, closeIdx + 200));
