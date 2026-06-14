import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Atualiza os dados do formulário conforme o usuário digita
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Envia os dados para o back-end
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, formData);
      
      // Salva o token de segurança no navegador e redireciona para a biblioteca
      localStorage.setItem('token', response.data.token);
      navigate('/biblioteca');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro na autenticação. Verifique seus dados.');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {isLogin ? t('login') : t('register')}
        </h2>
        
        {/* Mostra o campo Nome apenas se for Cadastro */}
        {!isLogin && (
          <input 
            type="text" name="name" placeholder="Seu Nome" 
            onChange={handleChange} required style={styles.input} 
          />
        )}
        <input 
          type="email" name="email" placeholder={t('email')} 
          onChange={handleChange} required style={styles.input} 
        />
        <input 
          type="password" name="password" placeholder={t('password')} 
          onChange={handleChange} required style={styles.input} 
        />
        
        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
          {isLogin ? t('login') : t('register')}
        </button>
        
        <p onClick={() => setIsLogin(!isLogin)} style={styles.toggleText}>
          {isLogin ? 'Criar uma conta' : 'Já tenho uma conta'}
        </p>
      </form>
    </div>
  );
};

// Estilos locais da página
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  form: { background: 'var(--surface-color)', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '350px' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: 'none', boxSizing: 'border-box', background: '#2c2c2c', color: 'white' },
  toggleText: { color: 'var(--accent-gold)', cursor: 'pointer', textAlign: 'center', marginTop: '20px', fontSize: '0.9em' }
};

export default Auth;