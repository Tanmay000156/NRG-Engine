const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const gBtn = html.indexOf('tabBtnGraphics');
console.log(html.slice(gBtn, gBtn + 4000));
