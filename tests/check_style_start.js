const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

const styleStart = content.indexOf('<style>');
console.log(content.substring(styleStart, styleStart + 1200));
