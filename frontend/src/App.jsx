import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { processOutbox, syncFullLibrary } from './services/api';

import Auth from './pages/Auth';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BookForm from './pages/BookForm';
import BookDetails from './pages/BookDetails';
import SharedLibraries from './pages/SharedLibraries';
import SharedLibraryView from './pages/SharedLibraryView';
import Settings from './pages/Settings';
import DeleteAccountInfo from './pages/DeleteAccountInfo';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Collections from './pages/Collections';
import CollectionForm from './pages/CollectionForm';
import CollectionDashboard from './pages/CollectionDashboard';
import ReloadPrompt from './components/ReloadPrompt';

// ==========================================
// GUARDAS DE ROTA (ROUTE GUARDS)
// ==========================================

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Navigate to="/biblioteca" replace /> : children;
};

// ==========================================
// INDICADOR VISUAL DE SINCRONIZAÇÃO
// ==========================================

const SyncIndicator = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail.status === 'syncing') setIsSyncing(true);
      if (e.detail.status === 'done' || e.detail.status === 'error') {
        setTimeout(() => setIsSyncing(false), 1500);
      }
    };

    window.addEventListener('violib-offline-sync', handleSync);
    return () => window.removeEventListener('violib-offline-sync', handleSync);
  }, []);

  if (!isSyncing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '0.85em',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        animation: 'authFadeDown 0.3s ease-out'
      }}
    >
      <span
        className="material-symbols-rounded spinner-icon"
        style={{ fontSize: '1.2em', animation: 'authSpin 1s linear infinite reverse' }}
      >
        sync
      </span>
      Sincronizando cache local...
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restabelecida! Iniciando sincronização da Outbox e da Base...');
      processOutbox().then(() => syncFullLibrary());
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      processOutbox().then(() => syncFullLibrary());
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <ReloadPrompt />
          <SyncIndicator />
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/biblioteca" replace />} />

              {/* ROTAS PÚBLICAS E POLÍTICAS */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                }
              />

              <Route path="/excluir-conta" element={<DeleteAccountInfo />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-de-servico" element={<TermsOfService />} />

              <Route path="/verificar-email/:token" element={<VerifyEmail />} />
              <Route path="/redefinir-senha/:token" element={<ResetPassword />} />

              {/* ROTAS PRIVADAS (Só acessa com Token) */}
              <Route
                path="/biblioteca"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/novo-livro"
                element={
                  <PrivateRoute>
                    <BookForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/livro/:id"
                element={
                  <PrivateRoute>
                    <BookDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/editar-livro/:id"
                element={
                  <PrivateRoute>
                    <BookForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bibliotecas-compartilhadas"
                element={
                  <PrivateRoute>
                    <SharedLibraries />
                  </PrivateRoute>
                }
              />
              <Route
                path="/compartilhada/:ownerId"
                element={
                  <PrivateRoute>
                    <SharedLibraryView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />

              {/* ROTAS DO MÓDULO DE COLEÇÕES (GAMIFICAÇÃO) */}
              <Route
                path="/colecoes"
                element={
                  <PrivateRoute>
                    <Collections />
                  </PrivateRoute>
                }
              />
              <Route
                path="/colecoes/nova"
                element={
                  <PrivateRoute>
                    <CollectionForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/colecoes/:id"
                element={
                  <PrivateRoute>
                    <CollectionDashboard />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/biblioteca" replace />} />
            </Routes>
          </Router>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
