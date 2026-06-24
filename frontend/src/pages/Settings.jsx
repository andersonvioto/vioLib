import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSettings from '../components/settings/ProfileSettings';
import ShareSettings from '../components/settings/ShareSettings';
import TaxonomyManager from '../components/settings/TaxonomyManager';
import GenreManager from '../components/settings/GenreManager';
import './settings.css';

/**
 * Página principal de Configurações.
 * Orquestra a navegação lateral e gerencia o carregamento sob demanda (Lazy Fetching) 
 * dos módulos internos.
 */
const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Mapa de renderização: Evita a repetição massiva de if/elses no retorno
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'shares':
        return <ShareSettings />;
      case 'authors':
        return <TaxonomyManager endpoint="authors" title="Gerenciar Autores" itemLabel="Autor" />;
      case 'translators':
        return <TaxonomyManager endpoint="translators" title="Gerenciar Tradutores" itemLabel="Tradutor" />;
      case 'genres':
        return <GenreManager />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="settings-container">
      
      <button onClick={() => navigate('/biblioteca')} className="btn-back">
        <span className="material-symbols-rounded">arrow_back</span> Voltar para a Biblioteca
      </button>

      <h1 className="settings-header">Configurações da Conta</h1>
      
      <div className="settings-layout">
        {/* Navegação Lateral / Swipeable Tabs (Mobile) */}
        <aside className="settings-sidebar">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Meu Perfil</button>
          <button className={activeTab === 'shares' ? 'active' : ''} onClick={() => setActiveTab('shares')}>Compartilhamento</button>
          <button className={activeTab === 'authors' ? 'active' : ''} onClick={() => setActiveTab('authors')}>Meus Autores</button>
          <button className={activeTab === 'translators' ? 'active' : ''} onClick={() => setActiveTab('translators')}>Meus Tradutores</button>
          <button className={activeTab === 'genres' ? 'active' : ''} onClick={() => setActiveTab('genres')}>Gêneros e Subgêneros</button>
        </aside>

        {/* Área de Injeção do Componente Ativo */}
        <main className="settings-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Settings;