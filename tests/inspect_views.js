const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const navIdx = html.indexOf('function navigateToSection');
if (navIdx !== -1) {
  console.log(html.slice(navIdx, navIdx + 1200));
}

// Find view panels
const views = [...html.matchAll(/class="[^"]*view-panel[^"]*"\s+id="([^"]+)"/g)].map(m => m[1]);
console.log('View panels with id:', views);

// Find sidebar nav buttons
const sidebarBtns = [...html.matchAll(/data-nav="([^"]+)"/g)].map(m => m[1]);
console.log('Sidebar data-nav items:', sidebarBtns);
