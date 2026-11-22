const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\tanma\\Desktop\\NRG-Engine-main\\index.html', 'utf8');

const profileMatches = [...content.matchAll(/id=["']profileDropdownMenu["']/g)];
console.log('profileDropdownMenu occurrences:', profileMatches.length);
profileMatches.forEach(m => console.log('Found at char:', m.index));

const notifMatches = [...content.matchAll(/id=["']notificationsDropdownMenu["']/g)];
console.log('notificationsDropdownMenu occurrences:', notifMatches.length);
notifMatches.forEach(m => console.log('Found at char:', m.index));

const overlayMatches = [...content.matchAll(/id=["']nrgOverlayLayer["']/g)];
console.log('nrgOverlayLayer occurrences:', overlayMatches.length);

// Also let's check where the dropdowns are located
profileMatches.forEach((m, idx) => {
  console.log(`--- Occurrence ${idx + 1} Context ---`);
  console.log(content.substring(Math.max(0, m.index - 100), Math.min(content.length, m.index + 200)));
});
