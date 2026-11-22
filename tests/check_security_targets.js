const fs = require('fs');
const compilerCode = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/api/_compiler.js', 'utf8');

console.log('spawnSync occurrences:', (compilerCode.match(/spawnSync/g) || []).length);
console.log('runLocalPython occurrences:', (compilerCode.match(/runLocalPython/g) || []).length);
