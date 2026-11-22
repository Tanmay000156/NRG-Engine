const fs = require('fs');
const path = require('path');

const legacyPath = path.resolve(__dirname, '../index.legacy.html');
const html = fs.readFileSync(legacyPath, 'utf8');

// Find TEMPLATES definition
const templatesIdx = html.indexOf('const STARTER_TEMPLATES =');
if (templatesIdx !== -1) {
  console.log('Found STARTER_TEMPLATES');
  console.log(html.slice(templatesIdx, templatesIdx + 500));
} else {
  console.log('Searching for templates...');
  const tMatches = [...html.matchAll(/(?:STARTER_TEMPLATES|DEFAULT_TEMPLATES|templates\s*=)/g)];
  console.log('Matches:', tMatches.map(m => m[0]));
}

// Find projects
const projIdx = html.indexOf('defaultProjects');
if (projIdx !== -1) {
  console.log('Found defaultProjects:\n', html.slice(projIdx - 50, projIdx + 400));
} else {
  const pMatches = [...html.matchAll(/INITIAL_PROJECTS|SAMPLE_PROJECTS/g)];
  console.log('Project matches:', pMatches.map(m => m[0]));
}
