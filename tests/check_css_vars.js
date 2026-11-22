const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

console.log('--- Around 8410 ---');
console.log(content.substring(8200, 8600));

console.log('--- Around 11502 ---');
console.log(content.substring(11300, 11700));
