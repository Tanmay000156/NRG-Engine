const fs = require('fs');
const path = require('path');
const bridgePy = fs.readFileSync(path.resolve(__dirname, '..', 'api', '_turtle_bridge.js'), 'utf8');

// Check if python wrapper sets default bgcolor
console.log('--- TURTLE BRIDGE CODE ---');
const idx = bridgePy.indexOf('bgcolor');
while (idx !== -1) {
  console.log(bridgePy.slice(idx - 50, idx + 200));
  break;
}
