const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const idx = html.indexOf('// User Profile & Notification Dropdown Handlers & Theme Consistency');
console.log(html.slice(idx, idx + 1200));
