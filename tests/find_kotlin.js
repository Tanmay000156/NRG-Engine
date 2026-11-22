const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const kotlinIdx = html.indexOf('kotlin: {');
console.log(html.slice(kotlinIdx, kotlinIdx + 600));
