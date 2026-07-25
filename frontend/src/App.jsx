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
import './App.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Navigate to="/biblioteca" replace /> : children;
};

const SyncIndicator = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail.status === 'syncing') {
        setIsSyncing(true);
      }
      if (e.detail.status === 'done' || e.detail.status === 'error') {
        const timer = setTimeout(() => setIsSyncing(false), 1500);
        return () => clearTimeout(timer);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener('violib-offline-sync', handleSync);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('violib-offline-sync', handleSync);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    if (isDismissed) {
      return (
        <button
          type="button"
          className="network-status-badge status-offline"
          onClick={() => setIsDismissed(false)}
          title="Modo Offline Ativo — Clique para expandir aviso"
          aria-label="Modo Offline Ativo — Clique para expandir aviso de conectividade"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            cloud_off
          </span>
        </button>
      );
    }

    return (
      <div className="network-status-bar status-offline" role="status" aria-live="polite">
        <div className="network-status-content">
          <span className="material-symbols-rounded" aria-hidden="true">
            cloud_off
          </span>
          <span>Modo Offline — Acervo em Cache Local</span>
        </div>
        <button
          type="button"
          className="btn-status-close"
          onClick={() => setIsDismissed(true)}
          title="Minimizar aviso"
          aria-label="Minimizar aviso de modo offline para emblema flutuante"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            close
          </span>
        </button>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="network-status-bar status-syncing" role="status" aria-live="polite">
        <div className="network-status-content">
          <span className="material-symbols-rounded" aria-hidden="true">
            sync
          </span>
          <span>Sincronizando com a nuvem...</span>
        </div>
      </div>
    );
  }

  return null;
};

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
                path="/colecoes/editar/:id"
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
