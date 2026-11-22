const fs = require('fs');
const html = fs.readFileSync('C:/Users/tanma/Desktop/NRG-Engine-main/index.html', 'utf8');

const buttonIds = [
  // Account
  'pmenuAccount', 'modalAccountProfile', 'btnCloseAccountModal', 'btnDoneAccountModal',
  // Preferences
  'pmenuPreferences', 'modalPreferences', 'btnClosePreferencesModal', 'btnCancelPreferencesModal', 'btnSavePreferencesModal',
  'prefFontSize', 'prefFontSizeVal', 'prefTabSize', 'prefWordWrap', 'prefAutoIndent',
  // Themes
  'pmenuTheme', 'modalThemes', 'btnCloseThemeModal', 'btnCancelThemeModal', 'btnDoneThemeModal', 'themeCardLight', 'themeCardDark',
  // Shortcuts
  'pmenuShortcuts', 'modalKeyboardShortcuts', 'btnCloseShortcutsModal', 'btnDoneShortcutsModal',
  // Help
  'pmenuHelp', 'modalHelpSupport', 'btnCloseHelpModal', 'btnDoneHelpModal',
  // Sign Out
  'pmenuSignOut', 'modalSignOutConfirm', 'btnCloseSignOutModal', 'btnCancelSignOutModal', 'btnConfirmSignOut',
  // Theme selector in Settings
  'themeOptGlassLight', 'themeOptCrystalObsidian'
];

let allFound = true;
for (const id of buttonIds) {
  const existsInHTML = html.includes(`id="${id}"`);
  console.log(`id="${id}": ${existsInHTML ? 'OK' : 'MISSING!'}`);
  if (!existsInHTML) allFound = false;
}
console.log('All elements exist:', allFound);
