import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LibraryContext } from '../contexts/LibraryContext';
import api from '../services/api';
import miniLogo from '../assets/violib-logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const { currentLibrary, setCurrentLibrary, sharedLibraries } = useContext(LibraryContext);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
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
    const formattedEmail = guestEmail ? guestEmail.toLowerCase().trim() : '';
    if (!formattedEmail) return;

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
        guestEmail: formattedEmail,
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
          <div className="brand-container">
            <img
              src={miniLogo}
              alt="vioLib — Página Inicial"
              className="brand-logo"
              onClick={() => {
                setCurrentLibrary(null);
                navigate('/biblioteca');
              }}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentLibrary(null);
                  navigate('/biblioteca');
                }
              }}
            />

            <div className="library-switcher-wrapper">
              <select
                className="library-select"
                value={currentLibrary ? currentLibrary.ownerId : 'mine'}
                onChange={handleLibraryChange}
                aria-label="Alternar entre biblioteca pessoal e compartilhadas"
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
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={isMenuOpen}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                {isMenuOpen ? 'close' : 'more_vert'}
              </span>
            </button>

            <nav
              className={`header-actions ${isMenuOpen ? 'open' : ''}`}
              aria-label="Ações principais do acervo"
            >
              {(!currentLibrary || currentLibrary.canViewLibrary) && isCollectionsPath && (
                <button
                  onClick={() => {
                    navigate('/biblioteca');
                    setIsMenuOpen(false);
                  }}
                  className="btn-action"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    library_books
                  </span>
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
                  <span className="material-symbols-rounded" aria-hidden="true">
                    workspace_premium
                  </span>
                  <span className="action-label">Coleções</span>
                </button>
              )}

              {!currentLibrary && (
                <>
                  <button
                    onClick={() => {
                      navigate('/configuracoes');
                      setIsMenuOpen(false);
                    }}
                    className="btn-action"
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      settings
                    </span>
                    <span className="action-label">Ajustes</span>
                  </button>

                  <button onClick={openShareModal} className="btn-action">
                    <span className="material-symbols-rounded" aria-hidden="true">
                      group_add
                    </span>
                    <span className="action-label">Compartilhar</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/novo-livro');
                      setIsMenuOpen(false);
                    }}
                    className="btn-action btn-primary"
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      library_add
                    </span>
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
                <span className="material-symbols-rounded" aria-hidden="true">
                  logout
                </span>
                <span className="action-label">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {showShareModal && (
        <div
          className="share-modal-overlay"
          role="dialog"
          aria-labelledby="share-modal-title"
          aria-modal="true"
        >
          <div className="share-modal-card">
            <h2 id="share-modal-title" className="share-modal-title">
              <span className="material-symbols-rounded" aria-hidden="true">
                group_add
              </span>
              Compartilhar Acervo
            </h2>
            <p className="share-modal-description">
              Convide alguém para visualizar a sua conta. Escolha o que essa pessoa poderá ver:
            </p>

            {shareMsg.text && (
              <div
                className={`share-modal-alert ${shareMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}
                role="alert"
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
                className="share-modal-input"
              />

              <div className="share-modal-permissions">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={shareLibraryPerm}
                    onChange={(e) => setShareLibraryPerm(e.target.checked)}
                    className="permission-checkbox"
                  />
                  <span>Acesso à Biblioteca Principal</span>
                </label>
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={shareCollectionsPerm}
                    onChange={(e) => setShareCollectionsPerm(e.target.checked)}
                    className="permission-checkbox"
                  />
                  <span>Acesso às Coleções</span>
                </label>
              </div>

              <div className="share-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="btn-modal-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSharing} className="btn-modal-submit">
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
