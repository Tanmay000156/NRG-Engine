const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const t10Idx = html.indexOf("id: 't10'");
console.log(html.slice(t10Idx, t10Idx + 600));
