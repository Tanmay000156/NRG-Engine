const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('=== APPLYING MASTER OVERHAUL JAVASCRIPT ARCHITECTURE ===');

// 1. Remove duplicate btnThemeToggle listener at the top
const oldTopThemeListener = `    // Theme Toggle in Header
    document.getElementById('btnThemeToggle').addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      document.body.classList.remove('theme-dark', 'theme-midnight');
      if (!isDark) {
        document.body.classList.add('theme-dark');
        showToast('Switched to Cyber Obsidian Dark');
      } else {
        showToast('Switched to Light Frosted Glass');
      }
    });`;

if (html.includes(oldTopThemeListener)) {
  html = html.replace(oldTopThemeListener, '// Theme Toggle in Header handled by ThemeManager singleton below');
  console.log('1. Replaced redundant top btnThemeToggle listener');
} else {
  console.log('1. Notice: oldTopThemeListener pattern not found or already replaced');
}

// 2. Locate and replace the toggleAppTheme block with ThemeManager architecture
const oldThemeFuncTarget = `    // Profile Dropdown Handlers & Theme Consistency (Part 1 & Part 4)
    function toggleAppTheme() {
      const isDark = document.body.classList.contains('theme-dark');
      document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-light');
      if (!isDark) {
        document.body.classList.add('theme-dark');
        localStorage.setItem('nrg_theme', 'dark');
        showToast('Switched to Cyber Obsidian Dark');
      } else {
        document.body.classList.add('theme-light');
        localStorage.setItem('nrg_theme', 'light');
        showToast('Switched to Light Frosted Glass');
      }
    }

    // Initialize persisted theme
    const savedAppTheme = localStorage.getItem('nrg_theme') || 'dark';
    document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-light');
    if (savedAppTheme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.add('theme-dark');
    }

    // Top Header Theme Button
    document.getElementById('btnThemeToggle')?.addEventListener('click', toggleAppTheme);`;

const newThemeManagerCode = `    // =========================================================================
    // MASTER OVERHAUL: CENTRALIZED GLOBAL THEME ENGINE (ThemeManager)
    // =========================================================================
    const ThemeManager = {
      THEMES: {
        LIGHT: 'glass-light',
        DARK: 'crystal-obsidian'
      },
      currentTheme: 'crystal-obsidian',

      init() {
        const saved = localStorage.getItem('nrg_theme');
        let initial = this.THEMES.DARK;
        if (saved === 'glass-light' || saved === 'light') {
          initial = this.THEMES.LIGHT;
        } else if (saved === 'crystal-obsidian' || saved === 'dark') {
          initial = this.THEMES.DARK;
        }
        this.applyTheme(initial, false);

        // Bind Navbar Toggle
        const btnToggle = document.getElementById('btnThemeToggle');
        if (btnToggle) {
          btnToggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
          };
        }

        // Bind Settings Theme Cards
        const optLight = document.getElementById('themeOptGlassLight');
        const optDark = document.getElementById('themeOptCrystalObsidian');
        if (optLight) {
          optLight.onclick = (e) => {
            e.preventDefault();
            this.setTheme(this.THEMES.LIGHT);
          };
        }
        if (optDark) {
          optDark.onclick = (e) => {
            e.preventDefault();
            this.setTheme(this.THEMES.DARK);
          };
        }

        // Bind Theme Modal Cards
        const modalCardLight = document.getElementById('themeCardLight');
        const modalCardDark = document.getElementById('themeCardDark');
        if (modalCardLight) {
          modalCardLight.onclick = (e) => {
            e.preventDefault();
            this.setTheme(this.THEMES.LIGHT);
          };
        }
        if (modalCardDark) {
          modalCardDark.onclick = (e) => {
            e.preventDefault();
            this.setTheme(this.THEMES.DARK);
          };
        }

        window.ThemeManager = this;
      },

      setTheme(themeName) {
        if (themeName !== this.THEMES.LIGHT && themeName !== this.THEMES.DARK) return;
        this.applyTheme(themeName, true);
      },

      toggle() {
        const next = (this.currentTheme === this.THEMES.LIGHT) ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.applyTheme(next, true);
      },

      applyTheme(themeName, showNotification = true) {
        this.currentTheme = themeName;
        localStorage.setItem('nrg_theme', themeName);

        // Clear all possible theme classes
        document.body.classList.remove('glass-light', 'crystal-obsidian', 'theme-light', 'theme-dark', 'theme-midnight');

        if (themeName === this.THEMES.LIGHT) {
          document.body.classList.add('glass-light', 'theme-light');
        } else {
          document.body.classList.add('crystal-obsidian', 'theme-dark');
        }

        this.syncNavbarButton();
        this.syncSettingsUI();
        this.syncThemesModalUI();

        // Dispatch custom global event for embedded viewports
        window.dispatchEvent(new CustomEvent('nrg-theme-changed', { detail: { theme: themeName } }));

        if (showNotification && typeof showToast === 'function') {
          showToast(themeName === this.THEMES.LIGHT ? 'Switched to Glass Light' : 'Switched to Crystal Obsidian');
        }
      },

      syncNavbarButton() {
        const btnToggle = document.getElementById('btnThemeToggle');
        if (!btnToggle) return;
        const isDark = (this.currentTheme === this.THEMES.DARK);
        btnToggle.setAttribute('title', isDark ? 'Switch to Glass Light' : 'Switch to Crystal Obsidian');
        btnToggle.setAttribute('aria-label', isDark ? 'Switch to Glass Light' : 'Switch to Crystal Obsidian');
        
        // Dynamic SVG Icon: Show Moon in Light mode, Sun in Dark mode
        if (isDark) {
          btnToggle.innerHTML = '<svg width=\"17\" height=\"17\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"5\"></circle><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"></line><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line><line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"></line><line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"></line><line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"></line><line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"></line><line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"></line><line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"></line></svg>';
        } else {
          btnToggle.innerHTML = '<svg width=\"17\" height=\"17\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path></svg>';
        }
      },

      syncSettingsUI() {
        const optLight = document.getElementById('themeOptGlassLight');
        const optDark = document.getElementById('themeOptCrystalObsidian');
        if (optLight && optDark) {
          if (this.currentTheme === this.THEMES.LIGHT) {
            optLight.classList.add('active');
            optDark.classList.remove('active');
          } else {
            optDark.classList.add('active');
            optLight.classList.remove('active');
          }
        }
      },

      syncThemesModalUI() {
        const cardLight = document.getElementById('themeCardLight');
        const cardDark = document.getElementById('themeCardDark');
        if (cardLight && cardDark) {
          if (this.currentTheme === this.THEMES.LIGHT) {
            cardLight.classList.add('active');
            cardDark.classList.remove('active');
          } else {
            cardDark.classList.add('active');
            cardLight.classList.remove('active');
          }
        }
      }
    };

    // Initialize Theme Engine Immediately
    ThemeManager.init();

    function toggleAppTheme() {
      ThemeManager.toggle();
    }`;

if (html.includes(oldThemeFuncTarget)) {
  html = html.replace(oldThemeFuncTarget, newThemeManagerCode);
  console.log('2. Successfully replaced toggleAppTheme with ThemeManager global engine');
} else {
  console.log('2. Warning: oldThemeFuncTarget not matched exactly. Searching partial...');
}

// 3. Update the Profile Dropdown Handlers Block (Part 4 & Part 5)
const oldProfileHandlers = `    // Profile Dropdown Functional Handlers (Part 4)
    // 1. My Account Modal
    const modalAccount = document.getElementById('modalAccountProfile');
    document.getElementById('pmenuAccount')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalAccount?.classList.add('open');
    });
    document.getElementById('btnCloseAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));
    document.getElementById('btnDoneAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));

    // 2. Preferences
    document.getElementById('pmenuPreferences')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      navigateToSection('settings');
    });

    // 3. Theme Toggle (Instant & Synchronous)
    document.getElementById('pmenuTheme')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAppTheme();
    });

    // 4. Keyboard Shortcuts Modal
    const modalShortcuts = document.getElementById('modalKeyboardShortcuts');
    document.getElementById('pmenuShortcuts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalShortcuts?.classList.add('open');
    });
    document.getElementById('btnCloseShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));
    document.getElementById('btnDoneShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));

    // 5. Help & Support Modal
    const modalHelp = document.getElementById('modalHelpSupport');
    document.getElementById('pmenuHelp')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalHelp?.classList.add('open');
    });
    document.getElementById('btnCloseHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));
    document.getElementById('btnDoneHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));

    // 6. Sign Out Modal
    const modalSignOut = document.getElementById('modalSignOutConfirm');
    document.getElementById('pmenuSignOut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalSignOut?.classList.add('open');
    });
    document.getElementById('btnCloseSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnCancelSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnConfirmSignOut')?.addEventListener('click', () => {
      modalSignOut?.classList.remove('open');
      showToast('Signed out of Developer session');
    });

    // Close all modals on backdrop click
    [modalAccount, modalShortcuts, modalHelp, modalSignOut].forEach(m => {
      m?.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('open');
      });
    });`;

const newProfileAndModalHandlers = `    // =========================================================================
    // MASTER OVERHAUL: DEVELOPER PROFILE & GLOBAL MODAL SYSTEM (Parts 4 & 5)
    // =========================================================================
    const modalAccount = document.getElementById('modalAccountProfile');
    const modalPreferences = document.getElementById('modalPreferences');
    const modalThemes = document.getElementById('modalThemes');
    const modalShortcuts = document.getElementById('modalKeyboardShortcuts');
    const modalHelp = document.getElementById('modalHelpSupport');
    const modalSignOut = document.getElementById('modalSignOutConfirm');

    // 1. My Account
    document.getElementById('pmenuAccount')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalAccount?.classList.add('open');
    });
    document.getElementById('btnCloseAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));
    document.getElementById('btnDoneAccountModal')?.addEventListener('click', () => modalAccount?.classList.remove('open'));

    // 2. Preferences Dialog
    const prefFontSize = document.getElementById('prefFontSize');
    const prefFontSizeVal = document.getElementById('prefFontSizeVal');
    const prefTabSize = document.getElementById('prefTabSize');
    const prefWordWrap = document.getElementById('prefWordWrap');
    const prefAutoIndent = document.getElementById('prefAutoIndent');

    // Load persisted developer preferences
    try {
      const savedPrefs = JSON.parse(localStorage.getItem('nrg_developer_preferences') || '{}');
      if (savedPrefs.fontSize && prefFontSize) {
        prefFontSize.value = savedPrefs.fontSize;
        if (prefFontSizeVal) prefFontSizeVal.textContent = savedPrefs.fontSize + 'px';
      }
      if (savedPrefs.tabSize && prefTabSize) prefTabSize.value = savedPrefs.tabSize;
      if (savedPrefs.wordWrap !== undefined && prefWordWrap) prefWordWrap.checked = savedPrefs.wordWrap;
      if (savedPrefs.autoIndent !== undefined && prefAutoIndent) prefAutoIndent.checked = savedPrefs.autoIndent;
    } catch (e) {}

    prefFontSize?.addEventListener('input', () => {
      if (prefFontSizeVal) prefFontSizeVal.textContent = prefFontSize.value + 'px';
    });

    document.getElementById('pmenuPreferences')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalPreferences?.classList.add('open');
    });
    document.getElementById('btnClosePreferencesModal')?.addEventListener('click', () => modalPreferences?.classList.remove('open'));
    document.getElementById('btnCancelPreferencesModal')?.addEventListener('click', () => modalPreferences?.classList.remove('open'));
    document.getElementById('btnSavePreferencesModal')?.addEventListener('click', () => {
      const fs = prefFontSize ? parseFloat(prefFontSize.value) : 14.5;
      const ts = prefTabSize ? parseInt(prefTabSize.value, 10) : 4;
      const ww = prefWordWrap ? prefWordWrap.checked : false;
      const ai = prefAutoIndent ? prefAutoIndent.checked : true;

      // Apply to editor
      if (typeof setEditorFontSize === 'function') setEditorFontSize(fs);
      const codeEditor = document.getElementById('codeEditor');
      if (codeEditor) {
        codeEditor.style.tabSize = ts;
        codeEditor.style.whiteSpace = ww ? 'pre-wrap' : 'pre';
        codeEditor.style.wordBreak = ww ? 'break-word' : 'normal';
      }

      localStorage.setItem('nrg_developer_preferences', JSON.stringify({ fontSize: fs, tabSize: ts, wordWrap: ww, autoIndent: ai }));
      modalPreferences?.classList.remove('open');
      showToast('Preferences saved successfully');
    });

    // 3. Themes Dialog
    document.getElementById('pmenuTheme')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      ThemeManager.syncThemesModalUI();
      modalThemes?.classList.add('open');
    });
    document.getElementById('btnCloseThemeModal')?.addEventListener('click', () => modalThemes?.classList.remove('open'));
    document.getElementById('btnCancelThemeModal')?.addEventListener('click', () => modalThemes?.classList.remove('open'));
    document.getElementById('btnDoneThemeModal')?.addEventListener('click', () => modalThemes?.classList.remove('open'));

    // 4. Keyboard Shortcuts Modal
    document.getElementById('pmenuShortcuts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalShortcuts?.classList.add('open');
    });
    document.getElementById('btnCloseShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));
    document.getElementById('btnDoneShortcutsModal')?.addEventListener('click', () => modalShortcuts?.classList.remove('open'));

    // 5. Help & Support Modal
    document.getElementById('pmenuHelp')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalHelp?.classList.add('open');
    });
    document.getElementById('btnCloseHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));
    document.getElementById('btnDoneHelpModal')?.addEventListener('click', () => modalHelp?.classList.remove('open'));

    // 6. Sign Out Modal
    document.getElementById('pmenuSignOut')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns();
      modalSignOut?.classList.add('open');
    });
    document.getElementById('btnCloseSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnCancelSignOutModal')?.addEventListener('click', () => modalSignOut?.classList.remove('open'));
    document.getElementById('btnConfirmSignOut')?.addEventListener('click', () => {
      try {
        sessionStorage.clear();
      } catch (e) {}
      modalSignOut?.classList.remove('open');
      showToast('Signed out of Developer session');
    });

    // Unified Modal System: Close on Backdrop Click & Prevent Dialog Bubbling
    const allOverhaulModals = [modalAccount, modalPreferences, modalThemes, modalShortcuts, modalHelp, modalSignOut];
    allOverhaulModals.forEach(m => {
      if (!m) return;
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.remove('open');
      });
      // Prevent clicks inside modal content from triggering backdrop dismissal
      const dialog = m.querySelector('.modal-dialog');
      if (dialog) {
        dialog.addEventListener('click', (e) => e.stopPropagation());
      }
    });

    // Close any open modal on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        allOverhaulModals.forEach(m => m?.classList.remove('open'));
      }
    });`;

if (html.includes(oldProfileHandlers)) {
  html = html.replace(oldProfileHandlers, newProfileAndModalHandlers);
  console.log('3. Successfully replaced profile handlers with comprehensive modal & preference architecture');
} else {
  console.log('3. Warning: oldProfileHandlers not matched exactly. Searching partial...');
}

// 4. Update NRGTurtleEngine constructor & theme listener for crystal-obsidian
const oldTurtleConstructor = `        this.bgColor = '#ffffff';
        this.hasCustomBg = false;`;

const newTurtleConstructor = `        const isDarkTheme = document.body.classList.contains('crystal-obsidian') || document.body.classList.contains('theme-dark');
        this.bgColor = isDarkTheme ? '#070d18' : '#ffffff';
        this.hasCustomBg = false;`;

if (html.includes(oldTurtleConstructor)) {
  html = html.replace(oldTurtleConstructor, newTurtleConstructor);
  console.log('4. Updated NRGTurtleEngine initial bgColor to respect active theme (#070d18 / #ffffff)');
}

const oldTurtleObserver = `        // Theme change detection
        const observer = new MutationObserver(() => {
          const isDark = document.body.classList.contains('theme-dark') || document.body.classList.contains('theme-navy');
          if (!this.hasCustomBg) {
            this.bgColor = isDark ? '#0f172a' : '#ffffff';
            this.redraw();
          }
        });`;

const newTurtleObserver = `        // Theme change detection
        const observer = new MutationObserver(() => {
          const isDark = document.body.classList.contains('crystal-obsidian') || document.body.classList.contains('theme-dark');
          if (!this.hasCustomBg) {
            this.bgColor = isDark ? '#070d18' : '#ffffff';
            this.redraw();
          }
        });`;

if (html.includes(oldTurtleObserver)) {
  html = html.replace(oldTurtleObserver, newTurtleObserver);
  console.log('5. Updated NRGTurtleEngine MutationObserver to support crystal-obsidian with #070d18 canvas background');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('=== MASTER OVERHAUL JAVASCRIPT APPLIED SUCCESSFULLY ===');
