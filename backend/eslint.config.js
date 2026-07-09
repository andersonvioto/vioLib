const js = require('@eslint/js');
const globals = require('globals');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  // 1. Regras recomendadas globais do JavaScript
  js.configs.recommended,

  // 2. Configurações específicas para o nosso ambiente Node.js
  {
    languageOptions: {
      // Diz ao ESLint que variáveis como 'process', '__dirname', 'require' existem e são válidas
      globals: {
        ...globals.node
      },
      ecmaVersion: 'latest',
      sourceType: 'commonjs'
    },
    rules: {
      'no-unused-vars': 'warn', // Apenas avisa se criar uma variável e não usar (em vez de quebrar a compilação)
      'no-console': 'off' // Permite o uso de console.log() no backend (essencial para debug e logs do servidor)
    }
  },

  // 3. Prettier SEMPRE no final para anular qualquer regra estética do ESLint
  eslintPluginPrettierRecommended
];
