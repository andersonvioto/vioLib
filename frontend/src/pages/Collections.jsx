import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import { LibraryContext } from '../contexts/LibraryContext';
import { getCoverUrl } from '../utils/bookHelpers';
import './Collections.css';

const Collections = () => {
  const navigate = useNavigate();
  const { currentLibrary } = useContext(LibraryContext);
  const isGuest = !!currentLibrary;

  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
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
    };
    fetchCollections();
  }, [currentLibrary]);

  const ownerName =
    currentLibrary?.ownerName ||
    currentLibrary?.Owner?.name ||
    currentLibrary?.User?.name ||
    'Amigo';

  return (
    <div className="dashboard-container">
      <Header />

      <div className="collections-header-bar">
        <div>
          <h1 className="collections-main-title">
            <span className="material-symbols-rounded">workspace_premium</span>
            {isGuest ? `Coleções de ${ownerName}` : 'Minhas Coleções'}
          </h1>
          <p className="collections-subtitle">
            {isGuest
              ? `Acompanhe o progresso das coleções e sagas de ${ownerName}.`
              : 'Acompanhe o seu progresso e complete os seus objetivos de leitura.'}
          </p>
        </div>

        {!isGuest && (
          <button className="btn-action btn-primary" onClick={() => navigate('/colecoes/nova')}>
            <span className="material-symbols-rounded">add_circle</span> Criar Coleção
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="collections-loading">
          <span className="material-symbols-rounded spinner-icon">sync</span> Carregando os
          álbuns...
        </div>
      ) : collections.length === 0 ? (
        <div className="empty-collections-state">
          <span className="material-symbols-rounded empty-icon">layers_clear</span>
          <h2>{isGuest ? 'Nenhuma coleção encontrada' : 'Ainda não tem nenhuma coleção!'}</h2>

          {isGuest ? (
            <p>Este usuário ainda não organizou os seus livros em coleções.</p>
          ) : (
            <>
              <p>Que tal começar a controlar aquela saga épica que quer completar?</p>
              <button className="btn-action btn-primary" onClick={() => navigate('/colecoes/nova')}>
                Iniciar Minha Primeira Coleção
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="collections-grid">
          {collections.map((col) => {
            const { stats } = col;
            const progressStyle = { '--progress': `${stats.progress}%` };

            return (
              <div
                key={col.id}
                className="collection-album-card"
                onClick={() => navigate(`/colecoes/${col.id}`)}
              >
                <div
                  className="collection-banner"
                  style={{
                    backgroundImage: col.bannerImage
                      ? `url(${getCoverUrl(col.bannerImage)})`
                      : 'none'
                  }}
                >
                  <div className="banner-overlay"></div>

                  <div className="progress-ring-container" style={progressStyle}>
                    <div className="progress-ring-inner">
                      <span className="progress-value">{stats.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="collection-info">
                  <h3 className="collection-title">{col.title}</h3>

                  <div className="collection-stats-bar">
                    <span className="stat-pill">
                      <span className="material-symbols-rounded">book</span>
                      {stats.ownedItems} / {stats.totalItems} Adquiridos
                    </span>
                  </div>

                  {col.description && <p className="collection-desc">{col.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Collections;
