import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext'; // <-- Nova Importação
import { AuthProvider } from './contexts/AuthContext';
import { LibraryProvider } from './contexts/LibraryContext';
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

// ==========================================
// GUARDAS DE ROTA (ROUTE GUARDS)
// ==========================================

// Impede acesso às telas internas se o usuário não estiver logado
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Impede que o usuário veja a tela de login se já estiver logado
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Navigate to="/biblioteca" replace /> : children;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <Router>
            <Routes>
              
              {/* Rota Raiz: Tenta mandar para a biblioteca. O PrivateRoute decide se deixa passar ou manda pro login */}
              <Route path="/" element={<Navigate to="/biblioteca" replace />} />
              
              {/* ROTAS PÚBLICAS E POLÍTICAS */}
              <Route path="/login" element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } />
              
              {/* Rotas Exigidas pela Google Play Store */}
              <Route path="/excluir-conta" element={<DeleteAccountInfo />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              
              <Route path="/verificar-email/:token" element={<VerifyEmail />} />
              <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
              
              {/* ROTAS PRIVADAS (Só acessa com Token) */}
              <Route path="/biblioteca" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/novo-livro" element={
                <PrivateRoute>
                  <BookForm />
                </PrivateRoute>
              } /> 
              <Route path="/livro/:id" element={
                <PrivateRoute>
                  <BookDetails />
                </PrivateRoute>
              } />
              <Route path="/editar-livro/:id" element={
                <PrivateRoute>
                  <BookForm />
                </PrivateRoute>
              } />
              <Route path="/bibliotecas-compartilhadas" element={
                <PrivateRoute>
                  <SharedLibraries />
                </PrivateRoute>
              } />
              <Route path="/compartilhada/:ownerId" element={
                <PrivateRoute>
                  <SharedLibraryView />
                </PrivateRoute>
              } />
              <Route path="/configuracoes" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />

              {/* Rota Coringa: Se digitar qualquer URL maluca, tenta mandar pra biblioteca */}
              <Route path="*" element={<Navigate to="/biblioteca" replace />} />
              
            </Routes>
          </Router>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;