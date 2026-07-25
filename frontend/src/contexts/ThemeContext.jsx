import { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('violib_theme') || 'system';
  });

  const [coverStyle, setCoverStyle] = useState(() => {
    return localStorage.getItem('violib_cover_style') || 'flat';
  });

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('violib_view_mode') || 'grid';
  });

  useEffect(() => {
    const root = document.documentElement;
    let activeTheme = theme;

    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', activeTheme);
    localStorage.setItem('violib_theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === 'system') {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-cover-style', coverStyle);
    localStorage.setItem('violib_cover_style', coverStyle);
  }, [coverStyle]);

  useEffect(() => {
    document.documentElement.setAttribute('data-view-mode', viewMode);
    localStorage.setItem('violib_view_mode', viewMode);
  }, [viewMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        coverStyle,
        setCoverStyle,
        viewMode,
        setViewMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
