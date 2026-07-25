import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import './AppearanceSettings.css';

/**
 * Componente responsável pelas configurações visuais do sistema:
 * Modo Claro/Escuro, Estilo de Capa (3D Isométrico) e Modo de Exibição da Grade.
 */
const AppearanceSettings = () => {
  const { theme, setTheme, coverStyle, setCoverStyle, viewMode, setViewMode } =
    useContext(ThemeContext);

  return (
    <section className="appearance-settings-section" aria-label="Ajustes de aparência e exibição">
      <h2 className="appearance-section-title">Aparência do Sistema</h2>

      <div className="appearance-group">
        <h3 className="appearance-group-title">Cor do Tema</h3>
        <div className="appearance-grid" role="radiogroup" aria-label="Selecione o tema de cor">
          <label className={`appearance-card ${theme === 'system' ? 'active' : ''}`}>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === 'system'}
              onChange={() => setTheme('system')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              devices
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Padrão do Sistema</strong>
              <span className="appearance-card-desc">Acompanha o tema do seu dispositivo</span>
            </div>
          </label>

          <label className={`appearance-card ${theme === 'light' ? 'active' : ''}`}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              light_mode
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Modo Claro</strong>
              <span className="appearance-card-desc">Tons marfim editorial e fundo iluminado</span>
            </div>
          </label>

          <label className={`appearance-card ${theme === 'dark' ? 'active' : ''}`}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              dark_mode
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Modo Escuro</strong>
              <span className="appearance-card-desc">Tons suaves de grafite e azul-noite</span>
            </div>
          </label>
        </div>
      </div>

      <div className="appearance-group">
        <h3 className="appearance-group-title">Visualização Padrão da Biblioteca</h3>
        <div
          className="appearance-grid"
          role="radiogroup"
          aria-label="Selecione o modo de visualização inicial"
        >
          <label className={`appearance-card ${viewMode === 'grid' ? 'active' : ''}`}>
            <input
              type="radio"
              name="viewMode"
              value="grid"
              checked={viewMode === 'grid'}
              onChange={() => setViewMode('grid')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              grid_view
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Capas Padrão</strong>
              <span className="appearance-card-desc">
                Capas médias com título e autoria em destaque
              </span>
            </div>
          </label>

          <label className={`appearance-card ${viewMode === 'compact' ? 'active' : ''}`}>
            <input
              type="radio"
              name="viewMode"
              value="compact"
              checked={viewMode === 'compact'}
              onChange={() => setViewMode('compact')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              apps
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Capas Compactas</strong>
              <span className="appearance-card-desc">
                Grade densa, ideal para acervos numerosos
              </span>
            </div>
          </label>

          <label className={`appearance-card ${viewMode === 'list' ? 'active' : ''}`}>
            <input
              type="radio"
              name="viewMode"
              value="list"
              checked={viewMode === 'list'}
              onChange={() => setViewMode('list')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              view_list
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Em Lista</strong>
              <span className="appearance-card-desc">
                Formato horizontal com metadados detalhados
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="appearance-group">
        <h3 className="appearance-group-title">Estilo das Capas na Grade</h3>
        <div
          className="appearance-grid"
          role="radiogroup"
          aria-label="Selecione o estilo de renderização das capas"
        >
          <label className={`appearance-card ${coverStyle === 'flat' ? 'active' : ''}`}>
            <input
              type="radio"
              name="coverStyle"
              value="flat"
              checked={coverStyle === 'flat'}
              onChange={() => setCoverStyle('flat')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              crop_portrait
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Simples (Padrão)</strong>
              <span className="appearance-card-desc">
                Capas planas, retangulares e de alto desempenho
              </span>
            </div>
          </label>

          <label className={`appearance-card ${coverStyle === 'book' ? 'active' : ''}`}>
            <input
              type="radio"
              name="coverStyle"
              value="book"
              checked={coverStyle === 'book'}
              onChange={() => setCoverStyle('book')}
              className="visually-hidden-radio"
            />
            <span className="material-symbols-rounded appearance-card-icon" aria-hidden="true">
              menu_book
            </span>
            <div className="appearance-card-text">
              <strong className="appearance-card-title">Livro Realista 3D</strong>
              <span className="appearance-card-desc">
                Adiciona volume, lombada e sombras isométricas
              </span>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
};

export default AppearanceSettings;
