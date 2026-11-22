import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LIGHT: 'glass-light',
  DARK: 'crystal-obsidian'
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nrg_theme');
      if (saved === 'glass-light' || saved === 'light') return THEMES.LIGHT;
      if (saved === 'crystal-obsidian' || saved === 'dark') return THEMES.DARK;
    }
    return THEMES.DARK;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Clear all possible legacy theme classes
    document.body.classList.remove('glass-light', 'crystal-obsidian', 'theme-light', 'theme-dark', 'theme-midnight');
    
    if (theme === THEMES.LIGHT) {
      document.body.classList.add('glass-light', 'theme-light');
    } else {
      document.body.classList.add('crystal-obsidian', 'theme-dark');
    }

    localStorage.setItem('nrg_theme', theme);
    window.dispatchEvent(new CustomEvent('nrg-theme-changed', { detail: { theme } }));
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  const setTheme = (newTheme) => {
    if (newTheme === THEMES.LIGHT || newTheme === THEMES.DARK) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === THEMES.DARK,
      toggleTheme,
      setTheme,
      THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
