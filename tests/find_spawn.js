const fs = require('fs');
const lines = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/api/_compiler.js', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('spawnSync') || l.includes('runLocalPython')) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
