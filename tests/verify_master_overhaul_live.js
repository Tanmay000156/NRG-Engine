const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3038;
const CDP_PORT = 9258;
const ARTIFACT_DIR = 'C:/Users/tanma/.gemini/antigravity-cli/brain/c01c1d9c-ad02-407b-b604-cfdd966075d3';

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let cmdId = 1;
function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = cmdId++;
    const msg = JSON.stringify({ id, method, params });
    const handler = (evt) => {
      const parsed = JSON.parse(evt.data);
      if (parsed.id === id) {
        ws.removeEventListener('message', handler);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function evalInPage(ws, expression) {
  const res = await cdpSend(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

async function captureScreenshot(ws, filename) {
  const res = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const localPath = path.resolve(__dirname, filename);
  fs.writeFileSync(localPath, buf);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(artifactPath, buf);
  console.log(`📸 Screenshot saved: ${filename} (Size: ${buf.length} bytes)`);
}

async function runMasterOverhaulVerification() {
  console.log('================================================================');
  console.log('🚀 MASTER OVERHAUL: COMPREHENSIVE VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Start Server
  console.log(`1. Launching server on port ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT }
  });

  await wait(1500);

  // 2. Launch Chrome Headless at 1920x1080 Full HD
  console.log(`2. Launching Chrome with CDP on port ${CDP_PORT} at 1920x1080...`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    `http://localhost:${PORT}`
  ]);

  await wait(2500);

  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No page target found');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  console.log('3. CDP Connected.\n');

  await cdpSend(ws, 'Page.enable');
  await cdpSend(ws, 'Runtime.enable');
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  await wait(2000);

  // Switch to Home view
  await evalInPage(ws, `if (typeof navigateToSection === 'function') navigateToSection('home');`);
  await wait(600);

  // -------------------------------------------------------------
  // TEST 1: GLOBAL THEME ENGINE & TOGGLE SYNCHRONIZATION
  // -------------------------------------------------------------
  console.log('--- TEST 1: THEME ARCHITECTURE & NAVBAR TOGGLE ---');
  
  // Set to crystal-obsidian first
  await evalInPage(ws, `ThemeManager.setTheme('crystal-obsidian');`);
  await wait(400);

  let themeCheck = await evalInPage(ws, `({
    currentTheme: ThemeManager.currentTheme,
    bodyHasDark: document.body.classList.contains('crystal-obsidian') && document.body.classList.contains('theme-dark'),
    bodyHasLight: document.body.classList.contains('glass-light'),
    settingsCardDarkActive: document.getElementById('themeOptCrystalObsidian')?.classList.contains('active'),
    settingsCardLightActive: document.getElementById('themeOptGlassLight')?.classList.contains('active'),
    navbarTitle: document.getElementById('btnThemeToggle')?.getAttribute('title'),
    storageTheme: localStorage.getItem('nrg_theme')
  })`);
  console.log('Theme in Crystal Obsidian:', themeCheck);
  if (!themeCheck.bodyHasDark || !themeCheck.settingsCardDarkActive) {
    throw new Error('Crystal Obsidian verification failed!');
  }
  await captureScreenshot(ws, 'master_overhaul_dark_dashboard.png');

  // Click Navbar Theme Toggle to switch to Glass Light
  console.log('\nClicking Navbar Theme Toggle (#btnThemeToggle)...');
  await evalInPage(ws, `document.getElementById('btnThemeToggle').click();`);
  await wait(500);

  themeCheck = await evalInPage(ws, `({
    currentTheme: ThemeManager.currentTheme,
    bodyHasLight: document.body.classList.contains('glass-light') && document.body.classList.contains('theme-light'),
    bodyHasDark: document.body.classList.contains('crystal-obsidian'),
    settingsCardLightActive: document.getElementById('themeOptGlassLight')?.classList.contains('active'),
    settingsCardDarkActive: document.getElementById('themeOptCrystalObsidian')?.classList.contains('active'),
    navbarTitle: document.getElementById('btnThemeToggle')?.getAttribute('title'),
    storageTheme: localStorage.getItem('nrg_theme')
  })`);
  console.log('Theme after Toggle -> Glass Light:', themeCheck);
  if (!themeCheck.bodyHasLight || !themeCheck.settingsCardLightActive || themeCheck.storageTheme !== 'glass-light') {
    throw new Error('Glass Light verification failed!');
  }
  await captureScreenshot(ws, 'master_overhaul_light_dashboard.png');

  // Toggle back to Crystal Obsidian
  await evalInPage(ws, `document.getElementById('btnThemeToggle').click();`);
  await wait(400);

  // -------------------------------------------------------------
  // TEST 2: GRAPHICS WORKSPACE THEME & VIEWPORT OBSIDIAN BACKGROUND
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: GRAPHICS WORKSPACE THEME CONSISTENCY ---');
  await evalInPage(ws, `
    const graphicsTab = document.querySelector('.term-tab[data-term-view="graphics"]') || document.querySelector('.term-tab[data-term-view="turtle"]');
    if (graphicsTab) graphicsTab.click();
  `);
  await wait(600);

  const graphicsCheck = await evalInPage(ws, `(() => {
    const panel = document.getElementById('termViewGraphics') || document.getElementById('termViewTurtle');
    const viewport = document.querySelector('.graphics-viewport') || document.querySelector('.turtle-viewport');
    const placeholder = document.querySelector('.graphics-placeholder-card') || document.querySelector('.turtle-placeholder-card');
    const pStyle = panel ? window.getComputedStyle(panel) : null;
    const vStyle = viewport ? window.getComputedStyle(viewport) : null;
    const plStyle = placeholder ? window.getComputedStyle(placeholder) : null;
    return {
      panelBg: pStyle ? pStyle.backgroundColor : null,
      viewportBg: vStyle ? vStyle.backgroundColor : null,
      placeholderBg: plStyle ? plStyle.backgroundColor : null,
      isPanelWhite: pStyle && (pStyle.backgroundColor === 'rgb(255, 255, 255)' || pStyle.backgroundColor === '#ffffff'),
      isViewportWhite: vStyle && (vStyle.backgroundColor === 'rgb(255, 255, 255)' || vStyle.backgroundColor === '#ffffff')
    };
  })()`);
  console.log('Graphics Workspace Styling in Crystal Obsidian:', graphicsCheck);
  if (graphicsCheck.isViewportWhite) {
    throw new Error('Graphics viewport is white in Crystal Obsidian!');
  }
  await captureScreenshot(ws, 'master_overhaul_dark_graphics.png');

  // -------------------------------------------------------------
  // TEST 3: DEVELOPER PROFILE DROPDOWN & MODAL ARCHITECTURE
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: DEVELOPER PROFILE MODAL ARCHITECTURE ---');

  // Open Themes Modal from Profile Menu
  console.log('Testing Profile Dropdown -> Themes Modal...');
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `
    document.getElementById('pmenuTheme').click();
  `);
  await wait(500);

  const themesModalCheck = await evalInPage(ws, `(() => {
    const modal = document.getElementById('modalThemes');
    const cardLight = document.getElementById('themeCardLight');
    const cardDark = document.getElementById('themeCardDark');
    return {
      isOpen: modal?.classList.contains('open'),
      cardLightActive: cardLight?.classList.contains('active'),
      cardDarkActive: cardDark?.classList.contains('active')
    };
  })()`);
  console.log('Themes Modal State:', themesModalCheck);
  if (!themesModalCheck.isOpen) throw new Error('Themes modal did not open!');
  await captureScreenshot(ws, 'master_overhaul_modal_themes.png');

  // Close Themes Modal with Done button
  await evalInPage(ws, `document.getElementById('btnDoneThemeModal').click();`);
  await wait(300);
  const themesClosed = await evalInPage(ws, `!document.getElementById('modalThemes')?.classList.contains('open')`);
  console.log('Themes Modal Closed with Done:', themesClosed);
  if (!themesClosed) throw new Error('Themes modal failed to close with Done button!');

  // Open Preferences Modal from Profile Menu
  console.log('\nTesting Profile Dropdown -> Preferences Modal...');
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `
    document.getElementById('pmenuPreferences').click();
  `);
  await wait(500);

  const prefsModalCheck = await evalInPage(ws, `(() => {
    const modal = document.getElementById('modalPreferences');
    const fsSlider = document.getElementById('prefFontSize');
    const tabSelect = document.getElementById('prefTabSize');
    return {
      isOpen: modal?.classList.contains('open'),
      fontSize: fsSlider ? fsSlider.value : null,
      tabSize: tabSelect ? tabSelect.value : null
    };
  })()`);
  console.log('Preferences Modal State:', prefsModalCheck);
  if (!prefsModalCheck.isOpen) throw new Error('Preferences modal did not open!');
  await captureScreenshot(ws, 'master_overhaul_modal_preferences.png');

  // Test Backdrop click propagation prevention: click inside dialog, should NOT close
  await evalInPage(ws, `
    const dialog = document.getElementById('modalPreferences').querySelector('.modal-dialog');
    dialog.click();
  `);
  await wait(200);
  const stillOpenAfterDialogClick = await evalInPage(ws, `document.getElementById('modalPreferences')?.classList.contains('open')`);
  console.log('Modal remains open when clicking inside dialog (no bubbling):', stillOpenAfterDialogClick);
  if (!stillOpenAfterDialogClick) throw new Error('Modal closed unexpectedly on dialog interior click!');

  // Save Preferences
  await evalInPage(ws, `
    const slider = document.getElementById('prefFontSize');
    if (slider) { slider.value = '16'; slider.dispatchEvent(new Event('input')); }
    document.getElementById('btnSavePreferencesModal').click();
  `);
  await wait(400);

  const prefsSaved = await evalInPage(ws, `(() => {
    const saved = JSON.parse(localStorage.getItem('nrg_developer_preferences') || '{}');
    const modalClosed = !document.getElementById('modalPreferences')?.classList.contains('open');
    return { modalClosed, savedFontSize: saved.fontSize };
  })()`);
  console.log('Preferences Saved & Closed:', prefsSaved);
  if (!prefsSaved.modalClosed || prefsSaved.savedFontSize !== 16) {
    throw new Error('Preferences save verification failed!');
  }

  // Test My Account Modal
  console.log('\nTesting Profile Dropdown -> My Account Modal...');
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `document.getElementById('pmenuAccount').click();`);
  await wait(300);
  const accountOpen = await evalInPage(ws, `document.getElementById('modalAccountProfile')?.classList.contains('open')`);
  console.log('Account Modal Open:', accountOpen);
  if (!accountOpen) throw new Error('Account modal did not open!');
  await evalInPage(ws, `document.getElementById('btnDoneAccountModal').click();`);
  await wait(300);
  const accountClosed = await evalInPage(ws, `!document.getElementById('modalAccountProfile')?.classList.contains('open')`);
  console.log('Account Modal Closed with Done:', accountClosed);
  if (!accountClosed) throw new Error('Account modal did not close!');

  // Test Keyboard Shortcuts Modal
  console.log('\nTesting Profile Dropdown -> Keyboard Shortcuts Modal...');
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `document.getElementById('pmenuShortcuts').click();`);
  await wait(300);
  const shortcutsOpen = await evalInPage(ws, `document.getElementById('modalKeyboardShortcuts')?.classList.contains('open')`);
  console.log('Shortcuts Modal Open:', shortcutsOpen);
  if (!shortcutsOpen) throw new Error('Shortcuts modal did not open!');
  await evalInPage(ws, `document.getElementById('btnCloseShortcutsModal').click();`);
  await wait(300);
  const shortcutsClosed = await evalInPage(ws, `!document.getElementById('modalKeyboardShortcuts')?.classList.contains('open')`);
  console.log('Shortcuts Modal Closed with ✕:', shortcutsClosed);
  if (!shortcutsClosed) throw new Error('Shortcuts modal did not close!');

  // Test Sign Out Modal
  console.log('\nTesting Profile Dropdown -> Sign Out Modal...');
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `document.getElementById('pmenuSignOut').click();`);
  await wait(300);
  const signOutOpen = await evalInPage(ws, `document.getElementById('modalSignOutConfirm')?.classList.contains('open')`);
  console.log('Sign Out Modal Open:', signOutOpen);
  if (!signOutOpen) throw new Error('Sign out modal did not open!');
  await evalInPage(ws, `document.getElementById('btnCancelSignOutModal').click();`);
  await wait(300);
  const signOutClosed = await evalInPage(ws, `!document.getElementById('modalSignOutConfirm')?.classList.contains('open')`);
  console.log('Sign Out Modal Closed with Cancel:', signOutClosed);
  if (!signOutClosed) throw new Error('Sign out modal did not close on cancel!');

  // Test Escape key closes modal
  await evalInPage(ws, `
    document.getElementById('userProfileBtn').click();
  `);
  await wait(300);
  await evalInPage(ws, `document.getElementById('pmenuShortcuts').click();`);
  await wait(300);
  await evalInPage(ws, `
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  `);
  await wait(300);
  const escClosed = await evalInPage(ws, `!document.getElementById('modalKeyboardShortcuts')?.classList.contains('open')`);
  console.log('Escape Key Closes Open Modal:', escClosed);
  if (!escClosed) throw new Error('Escape key did not close modal!');

  console.log('\n================================================================');
  console.log('✅ ALL MASTER OVERHAUL TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');

  ws.close();
  chrome.kill();
  server.kill();
  process.exit(0);
}

runMasterOverhaulVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
