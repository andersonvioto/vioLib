import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SharedLibraries = () => {
  const navigate = useNavigate();
  const [accesses, setAccesses] = useState([]);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const response = await api.get('/access/shared-with-me');
        setAccesses(response.data);
      } catch (error) {
        console.error('Erro ao buscar acessos:', error);
      }
    };
    fetchShared();
  }, []);
 

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Bibliotecas de Amigos</h1>
        <button className="btn-primary" onClick={() => navigate('/biblioteca')}>
          &larr; Minha Biblioteca
        </button>
      </header>

      {accesses.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Ninguém compartilhou uma biblioteca com você ainda.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {accesses.map((access) => (
            <div 
              key={access.id} 
              style={styles.card} 
              onClick={() => navigate(`/compartilhada/${access.ownerId}`)}
            >
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent-gold)' }}>
                Biblioteca de {access.Owner.name}
              </h3>
              <p style={{ margin: 0, color: '#aaa' }}>{access.Owner.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--accent-gold)', paddingBottom: '20px' },
  emptyState: { textAlign: 'center', marginTop: '50px', color: '#888', fontStyle: 'italic' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
  card: { background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)', cursor: 'pointer', transition: 'transform 0.2s' }
};

export default SharedLibraries;