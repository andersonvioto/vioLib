import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSettings from '../components/settings/ProfileSettings';
import ShareSettings from '../components/settings/ShareSettings';
import TaxonomyManager from '../components/settings/TaxonomyManager';
import GenreManager from '../components/settings/GenreManager';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import BlockManager from '../components/settings/BlockManager';
import './Settings.css';

/**
 * Página principal de Configurações do Acervo e da Conta.
 * Orquestra a navegação acessível por abas e gerencia a renderização sob demanda dos módulos internos.
 */
const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'shares':
        return <ShareSettings />;
      case 'blocks':
        return <BlockManager />;
      case 'authors':
        return <TaxonomyManager endpoint="authors" title="Gerenciar Autores" itemLabel="Autor" />;
      case 'translators':
        return (
          <TaxonomyManager
            endpoint="translators"
            title="Gerenciar Tradutores"
            itemLabel="Tradutor"
          />
        );
      case 'genres':
        return <GenreManager />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <button
          type="button"
          onClick={() => navigate('/biblioteca')}
          className="btn-back-settings"
          aria-label="Voltar para a biblioteca principal"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            arrow_back
          </span>
          <span>Voltar para a Biblioteca</span>
        </button>

        <div className="settings-title-wrapper">
          <span className="material-symbols-rounded settings-main-icon" aria-hidden="true">
            manage_accounts
          </span>
          <h1 className="settings-title">Configurações da Conta</h1>
        </div>
        <p className="settings-subtitle">
          Gerencie suas preferências de exibição, permissões de acesso e catalogação de autores e
          gêneros.
        </p>
      </header>

      <div className="settings-layout">
        <nav
          className="settings-sidebar"
          role="tablist"
          aria-label="Módulos de configuração do sistema"
        >
          <button
            type="button"
            role="tab"
            id="tab-profile"
            aria-selected={activeTab === 'profile'}
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              person
            </span>
            <span>Meu Perfil</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-appearance"
            aria-selected={activeTab === 'appearance'}
            className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              palette
            </span>
            <span>Aparência</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-shares"
            aria-selected={activeTab === 'shares'}
            className={`settings-tab-btn ${activeTab === 'shares' ? 'active' : ''}`}
            onClick={() => setActiveTab('shares')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              group
            </span>
            <span>Compartilhamento</span>
          </button>

          {/* NOVO: Tab de Bloqueios */}
          <button
            type="button"
            role="tab"
            id="tab-blocks"
            aria-selected={activeTab === 'blocks'}
            className={`settings-tab-btn ${activeTab === 'blocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocks')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              block
            </span>
            <span>Utilizadores Bloqueados</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-authors"
            aria-selected={activeTab === 'authors'}
            className={`settings-tab-btn ${activeTab === 'authors' ? 'active' : ''}`}
            onClick={() => setActiveTab('authors')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              history_edu
            </span>
            <span>Meus Autores</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-translators"
            aria-selected={activeTab === 'translators'}
            className={`settings-tab-btn ${activeTab === 'translators' ? 'active' : ''}`}
            onClick={() => setActiveTab('translators')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              translate
            </span>
            <span>Meus Tradutores</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-genres"
            aria-selected={activeTab === 'genres'}
            className={`settings-tab-btn ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => setActiveTab('genres')}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              category
            </span>
            <span>Gêneros e Subgêneros</span>
          </button>
        </nav>

        <main
          id="settings-tabpanel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="settings-content"
          tabIndex="0"
        >
          <div className="settings-content-fade" key={activeTab}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
