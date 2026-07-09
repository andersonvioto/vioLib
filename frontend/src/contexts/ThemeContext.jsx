import { createContext, useState, useEffect } from 'react';

// O comentário abaixo ensina o Vite a não reclamar sobre exportar contextos junto com componentes
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Estado do Tema (Claro/Escuro/Sistema)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('violib_theme') || 'system';
  });

  // 2. NOVO: Estado do Estilo da Capa (Flat/Book)
  const [coverStyle, setCoverStyle] = useState(() => {
    return localStorage.getItem('violib_cover_style') || 'flat';
  });

  // Efeito que controla a cor do Tema
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

  // NOVO: Efeito que aplica o estilo da capa globalmente
  useEffect(() => {
    document.documentElement.setAttribute('data-cover-style', coverStyle);
    localStorage.setItem('violib_cover_style', coverStyle);
  }, [coverStyle]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, coverStyle, setCoverStyle }}>
      {children}
    </ThemeContext.Provider>
  );
};
