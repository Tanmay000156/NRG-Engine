const fs = require('fs');
const buf = fs.readFileSync('C:/Users/tanma/nrg-engine/assets/tanmay_nrg_signature.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log('Image dimensions:', width, 'x', height);
console.log('Aspect ratio (width / height):', (width / height).toFixed(2));
