const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.legacy.html', 'utf8');

function findSnippetsOf(keyword) {
  let idx = 0;
  while ((idx = html.indexOf(keyword, idx + 1)) !== -1) {
    console.log(`[${keyword}] at ${idx}:`, html.slice(Math.max(0, idx - 40), Math.min(html.length, idx + 150)));
  }
}

console.log('--- sectionTemplates ---');
findSnippetsOf('sectionTemplates');

console.log('--- sectionProjects ---');
findSnippetsOf('sectionProjects');

console.log('--- sectionSnippets ---');
findSnippetsOf('sectionSnippets');
