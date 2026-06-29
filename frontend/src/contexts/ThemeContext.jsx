import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // O estado inicial procura no localStorage, se não achar, usa 'system' por padrão
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('violib_theme') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    let activeTheme = theme;

    // Se a escolha for 'system', descobrimos qual é a preferência do SO do usuário
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Injeta um atributo data-theme na tag <html> para o CSS reconhecer
    root.setAttribute('data-theme', activeTheme);
    
    // Salva a escolha (system, light ou dark) para a próxima visita
    localStorage.setItem('violib_theme', theme);

    // Cria um "ouvinte" para caso o usuário mude o tema do celular com o app aberto
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === 'system') {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};