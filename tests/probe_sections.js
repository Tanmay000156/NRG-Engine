const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

function findSnippet(keyword, length = 1000) {
  const idx = html.indexOf(keyword);
  if (idx === -1) {
    console.log(`Keyword "${keyword}" not found.`);
    return;
  }
  console.log(`=== Keyword: "${keyword}" at index ${idx} ===`);
  console.log(html.slice(idx, idx + length));
}

// 1. Settings Section
findSnippet('id="sectionSettings"');

// 2. Settings Theme Control in JS
findSnippet('settingTheme');
findSnippet('setTheme');

// 3. Graphics Tab Content
findSnippet('tabGraphicsContent');
findSnippet('tabContentGraphics');
findSnippet('turtleCanvas');

// 4. Modal Overlays & Event Handlers
findSnippet('id="modalAccountProfile"');
findSnippet('id="modalKeyboardShortcuts"');
findSnippet('id="modalHelpSupport"');
findSnippet('id="modalSignOutConfirm"');
findSnippet('modalPreferences');
findSnippet('modalThemes');
findSnippet('modalTheme');
