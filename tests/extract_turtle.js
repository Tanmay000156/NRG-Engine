const fs = require('fs');
const path = require('path');

const legacyPath = path.resolve(__dirname, '../index.legacy.html');
const html = fs.readFileSync(legacyPath, 'utf8');

const startIdx = html.indexOf('class NRGTurtleEngine');
// Find end of class: it ends right before "// Preset loaders" or "window.nrgTurtleEngine ="
const endIdx = html.indexOf('window.nrgTurtleEngine =');

const classCode = html.slice(startIdx, endIdx).trim();

const targetDir = path.resolve(__dirname, '../src/services');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const moduleCode = `// NRG ENGINE 2.0 — HTML5 Canvas Python Turtle Engine
${classCode}

export default NRGTurtleEngine;
`;

fs.writeFileSync(path.join(targetDir, 'turtleEngine.js'), moduleCode, 'utf8');
console.log('Saved src/services/turtleEngine.js (Length:', moduleCode.length, ')');
