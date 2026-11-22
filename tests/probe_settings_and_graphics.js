const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// 1. Check sectionSettings
const sIdx = html.indexOf('id="sectionSettings"');
const sEnd = html.indexOf('</section>', sIdx);
console.log('--- SECTION SETTINGS ---');
console.log(html.slice(sIdx, sIdx + 3000));

// 2. Check Graphics Dock and Content
const gIdx = html.indexOf('tabContentTurtle');
const gIdx2 = html.indexOf('tabContentGraphics');
const gIdx3 = html.indexOf('id="tabTurtle"');
const gIdx4 = html.indexOf('id="tabGraphics"');
console.log('--- GRAPHICS TAB SEARCH ---');
console.log({ gIdx, gIdx2, gIdx3, gIdx4 });
if (gIdx !== -1) console.log(html.slice(gIdx, gIdx + 1500));
if (gIdx2 !== -1) console.log(html.slice(gIdx2, gIdx2 + 1500));
if (gIdx4 !== -1) console.log(html.slice(gIdx4, gIdx4 + 1500));
