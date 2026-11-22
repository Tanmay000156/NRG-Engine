const fs = require('fs');
const lines = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/api/_compiler.js', 'utf8').split('\n');

console.log(lines.slice(325, 385).join('\n'));
