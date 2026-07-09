import { useRegisterSW } from 'virtual:pwa-register/react';
import './ReloadPrompt.css';

/**
 * Componente responsável por gerir o ciclo de vida do Service Worker.
 * Avisa o usuário quando o app foi instalado para uso offline
 * ou quando há uma nova atualização de código disponível no servidor.
 */
const ReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registrado:', r);
    },
    onRegisterError(error) {
      console.error('Erro ao registrar SW:', error);
    }
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Se não estiver pronto para offline e não precisar atualizar, não renderiza nada
  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="ReloadPrompt-container">
      <div className="ReloadPrompt-toast">
        <div className="ReloadPrompt-message">
          {offlineReady ? (
            <span>
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}
              >
                offline_pin
              </span>{' '}
              App pronto para uso offline!
            </span>
          ) : (
            <span>
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}
              >
                system_update
              </span>{' '}
              Nova atualização disponível!
            </span>
          )}
        </div>

        <div className="ReloadPrompt-actions">
          {needRefresh && (
            <button className="ReloadPrompt-btn primary" onClick={() => updateServiceWorker(true)}>
              Atualizar
            </button>
          )}
          <button className="ReloadPrompt-btn" onClick={close}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReloadPrompt;
