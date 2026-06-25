import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Nosso CSS global
import './i18n'; // Inicia o sistema de idiomas antes de renderizar a tela

// Importação do registrador do Service Worker gerado pelo vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// Inicia e gerencia o Service Worker do PWA
const updateSW = registerSW({
  // Engatilhado quando o sistema percebe que há um código novo no servidor
  onNeedRefresh() {
    // Para uma usabilidade premium, evitamos forçar o reload do nada.
    if (confirm('Nova atualização do vioLib disponível! Deseja recarregar o aplicativo para aplicar?')) {
      updateSW(true);
    }
  },
  // Engatilhado quando o cache inicial é concluído com sucesso
  onOfflineReady() {
    console.log('vioLib está pronto para uso offline (Modo PWA ativo).');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);