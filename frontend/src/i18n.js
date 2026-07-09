import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dicionários de tradução
const resources = {
  en: {
    translation: {
      welcome: 'Welcome to vioLib',
      login: 'Login',
      email: 'Email',
      password: 'Password',
      register: 'Register',
      library: 'My Library',
      add_book: 'Add Book'
    }
  },
  pt: {
    translation: {
      welcome: 'Bem-vindo ao vioLib',
      login: 'Entrar',
      email: 'E-mail',
      password: 'Senha',
      register: 'Cadastrar',
      library: 'Minha Biblioteca',
      add_book: 'Adicionar Livro'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'pt', // Idioma padrão inicial
  fallbackLng: 'en', // Se faltar tradução em PT, usa EN
  interpolation: {
    escapeValue: false // O React já protege contra injeção de código (XSS)
  }
});

export default i18n;
