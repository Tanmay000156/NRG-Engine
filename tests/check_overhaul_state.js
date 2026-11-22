const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

console.log('Includes modalPreferences:', html.includes('id="modalPreferences"'));
console.log('Includes modalThemes:', html.includes('id="modalThemes"'));
console.log('Includes themeOptGlassLight:', html.includes('id="themeOptGlassLight"'));
console.log('Includes ThemeManager:', html.includes('const ThemeManager =') || html.includes('window.ThemeManager =') || html.includes('ThemeManager'));
console.log('Includes btnClosePreferencesModal listener:', html.includes('btnClosePreferencesModal'));
console.log('Includes NRGTurtleEngine bgColor:', html.includes('this.bgColor'));
