const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

const matches = [...content.matchAll(/\.profile-dropdown-menu[^{]*\{[^}]*\}/g)];
matches.forEach(m => console.log(m[0]));
