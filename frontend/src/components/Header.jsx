import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LibraryContext } from '../contexts/LibraryContext';
import api from '../services/api';
import miniLogo from '../assets/violib-logo.png';

/**
 * Componente do cabeçalho principal da aplicação.
 * Renderiza o logotipo, o seletor de bibliotecas e o menu de ações do usuário.
 */
const Header = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { currentLibrary, setCurrentLibrary, sharedLibraries } = useContext(LibraryContext);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleShare = async () => {
    const guestEmail = window.prompt("Digite o e-mail do amigo que poderá ver sua biblioteca:");
    if (!guestEmail) return;
    
    try {
      const response = await api.post('/access/share', { guestEmail });
      alert(response.data.message);
    } catch (error) {
      alert('Erro: ' + (error.response?.data?.error || 'Não foi possível compartilhar.'));
    }
  };

  const handleLibraryChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "mine") {
      setCurrentLibrary(null);
    } else {
      const selectedLib = sharedLibraries.find(l => l.ownerId.toString() === selectedId);
      setCurrentLibrary(selectedLib);
    }
  };

  return (
    <header className="dash-header">
      <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img src={miniLogo} alt="vioLib" className="brand-logo" />
        
        {/* Seletor de Bibliotecas Compartilhadas */}
        <div className="library-switcher-wrapper">
          <select 
            className="form-select" 
            style={{ 
              backgroundColor: 'var(--bg-input)', 
              color: 'var(--accent-gold)', 
              fontWeight: 'bold', 
              border: '1px solid var(--accent-gold)', 
              borderRadius: '8px',
              padding: '10px 16px', // Aumentado para dar mais volume
              fontSize: '1rem',     // Fonte maior para leitura confortável
              minWidth: '220px',    // Impede que o seletor fique espremido
              cursor: 'pointer'
            }}
            value={currentLibrary ? currentLibrary.ownerId : "mine"}
            onChange={handleLibraryChange}
          >
            <option value="mine">Minha Biblioteca</option>
            
            {sharedLibraries.length > 0 && (
              <optgroup label="Compartilhadas Comigo">
                {sharedLibraries.map(lib => {
                  // Fallback dinâmico: tenta extrair o nome independente do formato do backend (flat ou aninhado)
                  const ownerName = lib.ownerName || lib.Owner?.name || lib.User?.name || 'Convidado';
                  
                  return (
                    <option key={lib.ownerId} value={lib.ownerId}>
                      Biblioteca de {ownerName}
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
        </div>
      </div>
      
      <div className="user-actions-container">
        <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="material-symbols-rounded">{isMenuOpen ? 'close' : 'more_vert'}</span>
        </button>

        <div className={`header-actions ${isMenuOpen ? 'open' : ''}`}>
          
          {/* Ações Visíveis Apenas na Própria Biblioteca */}
          {!currentLibrary && (
            <>
              <button onClick={() => { navigate('/configuracoes'); setIsMenuOpen(false); }} className="btn-action">
                <span className="material-symbols-rounded">settings</span> 
                <span className="action-label">Ajustes</span>
              </button>
              <button onClick={() => { handleShare(); setIsMenuOpen(false); }} className="btn-action">
                <span className="material-symbols-rounded">group_add</span> 
                <span className="action-label">Convidar</span>
              </button>
              <button onClick={() => { navigate('/novo-livro'); setIsMenuOpen(false); }} className="btn-action btn-primary">
                <span className="material-symbols-rounded">library_add</span> 
                <span className="action-label">Novo</span>
              </button>
            </>
          )}

          <button onClick={() => { logout(); setIsMenuOpen(false); }} className="btn-action btn-logout">
            <span className="material-symbols-rounded">logout</span> 
            <span className="action-label">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;