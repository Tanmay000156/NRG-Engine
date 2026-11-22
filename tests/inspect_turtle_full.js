const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

const tStart = html.indexOf('class NRGTurtleEngine');
const tEnd = html.indexOf('window.nrgTurtleEngine =');
console.log('NRGTurtleEngine length:', tEnd - tStart);
console.log(html.slice(tStart, tStart + 2000));
