const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

['pmenuAccount', 'pmenuPreferences', 'pmenuTheme', 'pmenuShortcuts', 'pmenuHelp', 'pmenuSignOut'].forEach(id => {
  const matches = [...html.matchAll(new RegExp(id, 'g'))];
  console.log(id, 'occurs', matches.length, 'times');
});

// Also check modal buttons
['btnCloseAccountModal', 'btnDoneAccountModal', 'btnClosePreferencesModal', 'btnSavePreferencesModal', 'btnCancelPreferencesModal', 'btnCloseThemeModal', 'btnDoneThemeModal', 'btnCloseShortcutsModal', 'btnDoneShortcutsModal', 'btnCloseHelpModal', 'btnDoneHelpModal', 'btnCancelSignOutModal', 'btnConfirmSignOutModal'].forEach(id => {
  const matches = [...html.matchAll(new RegExp(id, 'g'))];
  console.log(id, 'occurs', matches.length, 'times');
});
