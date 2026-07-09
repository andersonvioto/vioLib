import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'; // <-- 1. Importamos o Prettier

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    rules: {
      'react/prop-types': 'off' // (Opcional) Desliga os alertas chatos de PropTypes, caso não use
    }
  },
  // 2. Adicionamos o Prettier SEMPRE no final do array.
  // Ele vai ler o seu ficheiro .prettierrc (na raiz) e apontar erros visuais no ESLint.
  eslintPluginPrettierRecommended
]);
