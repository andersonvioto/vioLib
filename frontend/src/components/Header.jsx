import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LibraryContext } from '../contexts/LibraryContext';
import api from '../services/api';
import miniLogo from '../assets/violib-logo.png';
import './Header.css';

/**
 * Componente do cabeçalho principal da aplicação.
 */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const { currentLibrary, setCurrentLibrary, sharedLibraries } = useContext(LibraryContext);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- ESTADOS DO MODAL DE COMPARTILHAMENTO ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // Novas permissões no momento do convite
  const [shareLibraryPerm, setShareLibraryPerm] = useState(true);
  const [shareCollectionsPerm, setShareCollectionsPerm] = useState(true);

  const [isSharing, setIsSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState({ type: '', text: '' });

  const isCollectionsPath = location.pathname.startsWith('/colecoes');

  const openShareModal = () => {
    setShareMsg({ type: '', text: '' });
    setGuestEmail('');
    setShareLibraryPerm(true);
    setShareCollectionsPerm(true);
    setShowShareModal(true);
    setIsMenuOpen(false);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;

    if (!shareLibraryPerm && !shareCollectionsPerm) {
      return setShareMsg({
        type: 'error',
        text: 'Você precisa conceder acesso a pelo menos uma área.'
      });
    }

    setIsSharing(true);
    setShareMsg({ type: '', text: '' });

    try {
      const response = await api.post('/access/share', {
        guestEmail,
        canViewLibrary: shareLibraryPerm,
        canViewCollections: shareCollectionsPerm
      });
      setShareMsg({ type: 'success', text: response.data.message });
      setGuestEmail('');

      setTimeout(() => setShowShareModal(false), 2000);
    } catch (error) {
      setShareMsg({
        type: 'error',
        text: error.response?.data?.error || 'Não foi possível compartilhar a biblioteca.'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleLibraryChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'mine') {
      setCurrentLibrary(null);
    } else {
      const selectedLib = sharedLibraries.find((l) => l.ownerId.toString() === selectedId);
      setCurrentLibrary(selectedLib);

      // Roteamento Inteligente: Redireciona o usuário para onde ele tem permissão
      if (selectedLib) {
        if (selectedLib.canViewLibrary && !selectedLib.canViewCollections && isCollectionsPath) {
          navigate('/biblioteca');
        } else if (
          !selectedLib.canViewLibrary &&
          selectedLib.canViewCollections &&
          !isCollectionsPath
        ) {
          navigate('/colecoes');
        } else if (!selectedLib.canViewLibrary && !selectedLib.canViewCollections) {
          // Se não tiver permissão nenhuma (revogado), atira para a própria biblioteca
          setCurrentLibrary(null);
          navigate('/biblioteca');
        }
      }
    }
  };

  return (
    <>
      <header className="dash-header">
        <div className="dash-header-inner">
          <div
            className="brand-container"
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <img
              src={miniLogo}
              alt="vioLib"
              className="brand-logo"
              onClick={() => {
                setCurrentLibrary(null);
                navigate('/biblioteca');
              }}
              style={{ cursor: 'pointer' }}
            />

            <div className="library-switcher-wrapper">
              <select
                className="form-select library-select"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--accent-gold)',
                  fontWeight: 'bold',
                  border: '1px solid var(--accent-gold)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                value={currentLibrary ? currentLibrary.ownerId : 'mine'}
                onChange={handleLibraryChange}
              >
                <option value="mine">Minha Biblioteca</option>

                {sharedLibraries.length > 0 && (
                  <optgroup label="Compartilhadas Comigo">
                    {sharedLibraries.map((lib) => {
                      const ownerName =
                        lib.ownerName || lib.Owner?.name || lib.User?.name || 'Convidado';
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
              {/* O Visitante só vê os botões de navegação se o proprietário permitiu */}
              {(!currentLibrary || currentLibrary.canViewLibrary) && isCollectionsPath && (
                <button
                  onClick={() => {
                    navigate('/biblioteca');
                    setIsMenuOpen(false);
                  }}
                  className="btn-action"
                >
                  <span className="material-symbols-rounded">library_books</span>
                  <span className="action-label">Biblioteca</span>
                </button>
              )}

              {(!currentLibrary || currentLibrary.canViewCollections) && !isCollectionsPath && (
                <button
                  onClick={() => {
                    navigate('/colecoes');
                    setIsMenuOpen(false);
                  }}
                  className="btn-action"
                >
                  <span className="material-symbols-rounded">workspace_premium</span>
                  <span className="action-label">Coleções</span>
                </button>
              )}

              {/* Botões restritos ao Proprietário */}
              {!currentLibrary && (
                <>
                  <button
                    onClick={() => {
                      navigate('/configuracoes');
                      setIsMenuOpen(false);
                    }}
                    className="btn-action"
                  >
                    <span className="material-symbols-rounded">settings</span>
                    <span className="action-label">Ajustes</span>
                  </button>

                  <button onClick={openShareModal} className="btn-action">
                    <span className="material-symbols-rounded">group_add</span>
                    <span className="action-label">Compartilhar</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/novo-livro');
                      setIsMenuOpen(false);
                    }}
                    className="btn-action btn-primary"
                  >
                    <span className="material-symbols-rounded">library_add</span>
                    <span className="action-label">Novo</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="btn-action btn-logout"
              >
                <span className="material-symbols-rounded">logout</span>
                <span className="action-label">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card, #2c2c2c)',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid var(--accent-gold)',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <h2
              style={{
                color: 'var(--accent-gold)',
                marginTop: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-rounded">group_add</span>
              Compartilhar Acervo
            </h2>
            <p
              style={{
                color: 'var(--text-secondary, #aaa)',
                fontSize: '0.95rem',
                marginBottom: '20px'
              }}
            >
              Convide alguém para visualizar a sua conta. Escolha o que essa pessoa poderá ver:
            </p>

            {shareMsg.text && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  backgroundColor:
                    shareMsg.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(77, 255, 77, 0.1)',
                  color: shareMsg.type === 'error' ? '#ff4d4d' : '#4dff4d',
                  border: `1px solid ${shareMsg.type === 'error' ? '#ff4d4d' : '#4dff4d'}`
                }}
              >
                {shareMsg.text}
              </div>
            )}

            <form onSubmit={handleShareSubmit}>
              <input
                autoFocus
                type="email"
                required
                placeholder="E-mail do convidado..."
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-input, #1a1a1a)',
                  color: '#fff',
                  border: '1px solid var(--border-color, #444)',
                  fontSize: '1rem',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
              />

              {/* Opções Granulares no Convite */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '25px',
                  padding: '15px',
                  background: 'var(--bg-main)',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={shareLibraryPerm}
                    onChange={(e) => setShareLibraryPerm(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                  />
                  Acesso à Biblioteca Principal
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={shareCollectionsPerm}
                    onChange={(e) => setShareCollectionsPerm(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                  />
                  Acesso às Coleções
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: '#aaa',
                    border: '1px solid #aaa',
                    fontWeight: 'bold',
                    transition: '0.2s'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: isSharing ? 'not-allowed' : 'pointer',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#000',
                    border: 'none',
                    fontWeight: 'bold',
                    opacity: isSharing ? 0.7 : 1,
                    transition: '0.2s'
                  }}
                >
                  {isSharing ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
