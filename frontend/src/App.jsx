import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import VerifyEmail from './pages/VerifyEmail';    
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BookForm from './pages/BookForm'; 
import BookDetails from './pages/BookDetails';
import SharedLibraries from './pages/SharedLibraries';
import SharedLibraryView from './pages/SharedLibraryView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/verificar-email/:token" element={<VerifyEmail />} />
        <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
        <Route path="/biblioteca" element={<Dashboard />} />
        <Route path="/novo-livro" element={<BookForm />} /> 
        <Route path="/livro/:id" element={<BookDetails />} />
        <Route path="/editar-livro/:id" element={<BookForm />} />
        <Route path="/bibliotecas-compartilhadas" element={<SharedLibraries />} />
        <Route path="/compartilhada/:ownerId" element={<SharedLibraryView />} />
      </Routes>
    </Router>
  );
}

export default App;