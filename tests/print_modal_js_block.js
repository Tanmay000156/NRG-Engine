const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

console.log(html.slice(1819500, 1823000));
