import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import { LibraryContext } from '../contexts/LibraryContext';
import { getCoverUrl } from '../utils/bookHelpers';
import './Collections.css';

/**
 * Página principal de listagem das Coleções (Sagas, Objetivos e Álbuns).
 * Exibe cartões gamificados com anéis de progresso percentual.
 */
const Collections = () => {
  const navigate = useNavigate();
  const { currentLibrary } = useContext(LibraryContext);
  const isGuest = !!currentLibrary;

  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    try {
      const endpoint = currentLibrary
        ? `/access/${currentLibrary.ownerId}/collections`
        : '/collections';
      const response = await api.get(endpoint);
      setCollections(response.data);
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLibrary]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const ownerName =
    currentLibrary?.ownerName ||
    currentLibrary?.Owner?.name ||
    currentLibrary?.User?.name ||
    'Convidado';

  const handleCardKeyDown = (e, colId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/colecoes/${colId}`);
    }
  };

  return (
    <div className="dashboard-container">
      <Header />

      <header className="collections-header-bar">
        <div className="collections-header-text">
          <h1 className="collections-main-title">
            <span className="material-symbols-rounded" aria-hidden="true">
              workspace_premium
            </span>
            <span>{isGuest ? `Coleções de ${ownerName}` : 'Minhas Coleções'}</span>
          </h1>
          <p className="collections-subtitle">
            {isGuest
              ? `Acompanhe o progresso das coleções e sagas catalogadas por ${ownerName}.`
              : 'Acompanhe o seu progresso de leitura e complete suas sagas bibliográficas.'}
          </p>
        </div>

        {!isGuest && (
          <button
            type="button"
            className="btn-action btn-primary btn-create-col"
            onClick={() => navigate('/colecoes/nova')}
            aria-label="Criar nova coleção"
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              add_circle
            </span>
            <span>Criar Coleção</span>
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="collections-loading" role="status" aria-live="polite">
          <span className="material-symbols-rounded spinner-icon" aria-hidden="true">
            sync
          </span>
          <span>Carregando os álbuns da coleção...</span>
        </div>
      ) : collections.length === 0 ? (
        <section className="empty-collections-state" role="status">
          <span className="material-symbols-rounded empty-icon" aria-hidden="true">
            layers_clear
          </span>
          <h2>{isGuest ? 'Nenhuma coleção encontrada' : 'Ainda não tem nenhuma coleção!'}</h2>

          {isGuest ? (
            <p>Este usuário ainda não organizou os seus livros em coleções personalizadas.</p>
          ) : (
            <div className="empty-actions-wrapper">
              <p>Que tal começar a catalogar aquela saga épica que você deseja completar?</p>
              <button
                type="button"
                className="btn-action btn-primary"
                onClick={() => navigate('/colecoes/nova')}
              >
                <span>Iniciar Minha Primeira Coleção</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="collections-grid" aria-label="Lista de álbuns da coleção">
          {collections.map((col) => {
            const { stats } = col;
            const progressStyle = { '--progress': `${stats.progress}%` };
            const isCompleted = stats.progress === 100;

            return (
              <article
                key={col.id}
                className={`collection-album-card ${isCompleted ? 'is-completed' : ''}`}
                onClick={() => navigate(`/colecoes/${col.id}`)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => handleCardKeyDown(e, col.id)}
                aria-label={`Coleção ${col.title}, ${stats.progress}% concluída com ${stats.ownedItems} de ${stats.totalItems} itens adquiridos`}
              >
                <div
                  className="collection-banner"
                  style={{
                    backgroundImage: col.bannerImage
                      ? `url(${getCoverUrl(col.bannerImage)})`
                      : 'none'
                  }}
                >
                  <div className="banner-overlay" aria-hidden="true"></div>

                  <div className="progress-ring-container" style={progressStyle}>
                    <div className="progress-ring-inner">
                      <span className="progress-value">{stats.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="collection-info">
                  <header className="collection-info-header">
                    <h3 className="collection-title">{col.title}</h3>
                    {isCompleted && (
                      <span className="completed-badge" title="Coleção Completa!">
                        <span className="material-symbols-rounded" aria-hidden="true">
                          verified
                        </span>
                      </span>
                    )}
                  </header>

                  <div className="collection-stats-bar">
                    <span className="stat-pill">
                      <span className="material-symbols-rounded" aria-hidden="true">
                        book
                      </span>
                      <span>
                        <strong>{stats.ownedItems}</strong> / {stats.totalItems} Adquiridos
                      </span>
                    </span>
                  </div>

                  {col.description && <p className="collection-desc">{col.description}</p>}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default Collections;
