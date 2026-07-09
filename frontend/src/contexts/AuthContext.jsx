import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

/**
 * Provedor de Autenticação.
 * Garante a hidratação da sessão ao carregar a página, gerencia o login/logout
 * e controla o logout automático por inatividade caso o usuário não tenha
 * marcado a opção "Permanecer conectado".
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  /**
   * Centraliza a lógica de inicialização de sessão.
   */
  const login = useCallback((token, userData, rememberMe) => {
    localStorage.setItem('token', token);

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    setUser(userData);
  }, []);

  /**
   * Centraliza a lógica de desconexão.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    setUser(null);
    window.location.href = '/login';
  }, []);

  // ==========================================
  // 1. HIDRATAÇÃO DA SESSÃO (Recuperação no F5)
  // ==========================================
  useEffect(() => {
    const hydrateSession = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const response = await api.get('/users/profile');
          setUser(response.data);
        } catch (error) {
          console.error(error);
          console.warn('Sessão expirada ou inválida. Limpando credenciais.');
          logout();
        }
      }
      setLoadingInitial(false);
    };

    hydrateSession();
  }, [logout]);

  // ==========================================
  // 2. DETECTOR DE INATIVIDADE (Idle Timer)
  // ==========================================
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';

    // Ignora o timer se a opção de manter conectado estiver ativa ou se não houver usuário
    if (rememberMe || !user) return;

    let timeoutId;
    const TIMEOUT_MS = 60 * 60 * 1000; // Tempo de inatividade limite: 1 hora (em milissegundos)

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Sua sessão expirou por inatividade. Por segurança, faça login novamente.');
        logout();
      }, TIMEOUT_MS);
    };

    // Eventos DOM que configuram "interação humana"
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    let throttleTimer;

    const handleInteraction = () => {
      // Throttle: impede múltiplas execuções no mesmo segundo, salvando a performance da UI
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000);
    };

    // Anexa os ouvintes de evento à janela principal
    events.forEach((event) => window.addEventListener(event, handleInteraction));
    resetTimer(); // Inicia a contagem assim que o componente é montado

    // Função de limpeza (cleanup) executada quando o componente é desmontado
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(throttleTimer);
      events.forEach((event) => window.removeEventListener(event, handleInteraction));
    };
  }, [user, logout]);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  // Bloqueia a renderização dos componentes filhos até o token ser validado
  if (loadingInitial) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-gold)'
        }}
      >
        <span
          className="material-symbols-rounded spinner-icon"
          style={{ fontSize: '3rem', animation: 'authSpin 1s linear infinite reverse' }}
        >
          sync
        </span>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
