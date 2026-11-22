const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

const idx = content.indexOf('function closeAllHeaderDropdowns()');
console.log(content.substring(idx, idx + 1800));
