import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

/**
 * Componente responsável pelas configurações visuais do aplicativo (Modo Claro/Escuro)
 */
const AppearanceSettings = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  const getCardStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
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
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Escolha como a vioLib será exibida no seu dispositivo.
      </p>
      
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
          <span className="material-symbols-rounded" style={{ fontSize: '2em', color: theme === 'system' ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            devices
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em', marginBottom: '4px' }}>Padrão do Sistema</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>Acompanha automaticamente o tema do seu dispositivo</span>
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
          <span className="material-symbols-rounded" style={{ fontSize: '2em', color: theme === 'light' ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            light_mode
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em', marginBottom: '4px' }}>Modo Claro</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>Visual elegante em tons marfim e fundo claro</span>
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
          <span className="material-symbols-rounded" style={{ fontSize: '2em', color: theme === 'dark' ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            dark_mode
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1em', marginBottom: '4px' }}>Modo Escuro</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>Visual noturno suave em tons de grafite</span>
          </div>
        </label>

      </div>
    </div>
  );
};

export default AppearanceSettings;