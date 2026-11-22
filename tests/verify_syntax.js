const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

// 1. Check for leftover identifiers
const terms = ['workerStatusBadge', 'worker-status-badge', 'workerPulseDot', 'workerStatusText', 'modalWorkerConfig', 'setInterval(checkWorkerHealth'];
let termFailures = 0;
terms.forEach(term => {
  const found = content.includes(term);
  console.log(`Term "${term}": ${found ? 'FOUND (❌)' : 'CLEAN (✔)'}`);
  if (found) termFailures++;
});

// 2. Extract and validate all script tags
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let syntaxErrors = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  if (!scriptContent.trim()) continue;
  try {
    new vm.Script(scriptContent);
    console.log(`Script tag ${scriptIdx} syntax OK (${scriptContent.length} chars)`);
  } catch (err) {
    console.error(`Script tag ${scriptIdx} SYNTAX ERROR:`, err.message);
    syntaxErrors++;
  }
  scriptIdx++;
}

console.log(`\nResults: ${termFailures} leftover terms, ${syntaxErrors} syntax errors.`);
if (termFailures > 0 || syntaxErrors > 0) {
  process.exit(1);
} else {
  console.log('ALL SYNTAX & CLEANUP CHECKS PASSED PERFECTLY!');
}
