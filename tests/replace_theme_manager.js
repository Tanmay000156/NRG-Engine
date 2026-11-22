const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const targetBlock = `    // User Profile & Notification Dropdown Handlers & Theme Consistency (Part 1 & Part 4)
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

        // Clear all possible legacy theme classes
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

if (html.includes(targetBlock)) {
  html = html.replace(targetBlock, newThemeManagerCode);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Successfully replaced targetBlock with ThemeManager singleton!');
} else {
  console.error('Target block not found!');
}
