import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

/**
 * Componente responsável pelas configurações visuais (Modo Claro/Escuro, Estilo de Capa e Visualização)
 */
const AppearanceSettings = () => {
  const { theme, setTheme, coverStyle, setCoverStyle, viewMode, setViewMode } =
    useContext(ThemeContext);

  const getCardStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '15px 20px',
    border: `2px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    backgroundColor: isActive ? 'var(--accent-gold-glow)' : 'var(--bg-input)',
    transition: 'var(--transition-smooth)',
    marginBottom: '15px'
  });

  return (
    <div className="settings-section">
      <h2 style={{ color: 'var(--accent-gold)', marginBottom: '10px' }}>Aparência</h2>

      {/* SEÇÃO 1: TEMA CLARO/ESCURO */}
      <h3 style={{ marginTop: '20px', marginBottom: '15px', fontSize: '1.1em' }}>Cor do Tema</h3>
      <div className="theme-options">
        <label style={getCardStyle(theme === 'system')}>
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === 'system'}
            onChange={() => setTheme('system')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: theme === 'system' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            devices
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Padrão do Sistema</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Acompanha o dispositivo
            </span>
          </div>
        </label>

        <label style={getCardStyle(theme === 'light')}>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === 'light'}
            onChange={() => setTheme('light')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: theme === 'light' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            light_mode
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Modo Claro</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Tons marfim e fundo claro
            </span>
          </div>
        </label>

        <label style={getCardStyle(theme === 'dark')}>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={() => setTheme('dark')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: theme === 'dark' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            dark_mode
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Modo Escuro</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Tons suaves de grafite
            </span>
          </div>
        </label>
      </div>

      {/* SEÇÃO 2: MODO DE VISUALIZAÇÃO PADRÃO (NOVO) */}
      <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '1.1em' }}>
        Visualização da Biblioteca
      </h3>
      <div className="theme-options">
        <label style={getCardStyle(viewMode === 'grid')}>
          <input
            type="radio"
            name="viewMode"
            value="grid"
            checked={viewMode === 'grid'}
            onChange={() => setViewMode('grid')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: viewMode === 'grid' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            grid_view
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Grelha Padrão</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Capas médias com título e autor
            </span>
          </div>
        </label>

        <label style={getCardStyle(viewMode === 'compact')}>
          <input
            type="radio"
            name="viewMode"
            value="compact"
            checked={viewMode === 'compact'}
            onChange={() => setViewMode('compact')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: viewMode === 'compact' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            apps
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Grelha Compacta</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Capas pequenas, ideal para acervos grandes
            </span>
          </div>
        </label>

        <label style={getCardStyle(viewMode === 'list')}>
          <input
            type="radio"
            name="viewMode"
            value="list"
            checked={viewMode === 'list'}
            onChange={() => setViewMode('list')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: viewMode === 'list' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            view_list
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Em Lista</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Formato de tabela horizontal com mais detalhes
            </span>
          </div>
        </label>
      </div>

      {/* SEÇÃO 3: ESTILO DAS CAPAS */}
      <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '1.1em' }}>
        Estilo das Capas
      </h3>
      <div className="theme-options">
        <label style={getCardStyle(coverStyle === 'flat')}>
          <input
            type="radio"
            name="coverStyle"
            value="flat"
            checked={coverStyle === 'flat'}
            onChange={() => setCoverStyle('flat')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: coverStyle === 'flat' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            crop_portrait
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Simples (Padrão)</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Capas planas e retangulares
            </span>
          </div>
        </label>

        <label style={getCardStyle(coverStyle === 'book')}>
          <input
            type="radio"
            name="coverStyle"
            value="book"
            checked={coverStyle === 'book'}
            onChange={() => setCoverStyle('book')}
            style={{ display: 'none' }}
          />
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: '2em',
              color: coverStyle === 'book' ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            menu_book
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em' }}>Livro Realista 3D</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Adiciona volume, lombada e sombras às capas
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default AppearanceSettings;
