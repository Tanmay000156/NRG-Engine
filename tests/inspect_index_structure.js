const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

console.log('index.html size in bytes:', html.length);

const sections = [...html.matchAll(/id="section-([^"]+)"/g)].map(m => m[1]);
console.log('Sections found:', sections);

const modals = [...html.matchAll(/id="(modal[^"]+|paletteModal|[^"]+Modal)"/g)].map(m => m[1]);
console.log('Modals found:', modals);

const scriptTags = [...html.matchAll(/<script[\s\S]*?<\/script>/g)];
console.log('Number of script tags:', scriptTags.length);
if (scriptTags.length > 0) {
  console.log('Main script length in chars:', scriptTags[0][0].length);
}
