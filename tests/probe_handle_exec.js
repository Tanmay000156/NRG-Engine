const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const hIdx = html.indexOf('function handleExecutionResult');
console.log(html.slice(hIdx + 1500, hIdx + 5000));
