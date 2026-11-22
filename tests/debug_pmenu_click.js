const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const pmenuThemeIdx = html.indexOf("document.getElementById('pmenuTheme')");
console.log(html.slice(pmenuThemeIdx, pmenuThemeIdx + 300));

const userProfileBtnIdx = html.indexOf("userProfileBtn");
console.log('--- userProfileBtn occurrences ---');
let cur = 0;
while ((cur = html.indexOf("userProfileBtn", cur + 1)) !== -1) {
  console.log(html.slice(cur - 40, cur + 200), '\n---');
}
