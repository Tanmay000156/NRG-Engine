const fs = require('fs');
const content = fs.readFileSync('C:/Users/tanma/nrg-engine/index.html', 'utf8');

console.log('File size:', (content.length / 1024).toFixed(1) + ' KB');
console.log('Total lines:', content.split('\n').length);

const checks = [
  'renderAnsiTerminal',
  'initWorkspaceResizer',
  'workspaceResizer',
  'promptCreateNewFile',
  'exportAsHtml',
  'downloadActiveFile',
  'openFindBar',
  'recordRunHistory',
  'workspaceDropdownMenu',
  'toggleMaximizeEditor',
  'toggleMaximizeTerminal',
  'toggleCollapseTerminal',
  'toggleWordWrap',
  'setEditorFontSize',
  'dev-sig-name',
  'Tanmay Verma'
];

let allPassed = true;
checks.forEach(c => {
  const ok = content.includes(c);
  console.log((ok ? '✓' : '✗') + ' ' + c);
  if (!ok) allPassed = false;
});

if (!allPassed) {
  console.error('FAILED checks!');
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED!');
}
