const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>');
const modalThemesIdx = html.indexOf('id="modalThemes"');
const modalPreferencesIdx = html.indexOf('id="modalPreferences"');

console.log('scriptStart:', scriptStart);
console.log('scriptEnd:', scriptEnd);
console.log('modalThemesIdx:', modalThemesIdx);
console.log('modalPreferencesIdx:', modalPreferencesIdx);
console.log('Are modals AFTER script?', modalThemesIdx > scriptEnd);
