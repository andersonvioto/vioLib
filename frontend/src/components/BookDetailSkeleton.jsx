/**
 * Componente visual de Skeleton (Carregamento Fantasma).
 * Imita a estrutura exata de BookDetail.jsx para evitar saltos de layout (Cumulative Layout Shift)
 * enquanto a API processa os dados da obra.
 */
const BookDetailSkeleton = () => {
  return (
    <div className="details-container">
      
      {/* 1. Imitação do Cabeçalho */}
      <div className="details-header">
        <div className="skeleton-base" style={{ width: '80px', height: '24px' }}></div>
        <div className="skeleton-base" style={{ width: '150px', height: '36px', borderRadius: '8px' }}></div>
      </div>

      <div className="editorial-layout">
        
        {/* 2. Imitação da Capa */}
        <div className="cover-wrapper">
          <div className="skeleton-base details-cover" style={{ aspectRatio: '2/3', width: '100%' }}></div>
        </div>

        <div className="details-content">
          
          {/* 3. Imitação do Título e Autor */}
          <div>
            <div className="skeleton-base" style={{ width: '85%', height: '3.5em', marginBottom: '15px' }}></div>
            <div className="skeleton-base" style={{ width: '50%', height: '1.5em' }}></div>
          </div>

          {/* 4. Imitação da Grade de Metadados */}
          <div className="meta-grid">
            {/* Geramos 8 blocos de metadados genéricos para preencher a grade */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="meta-item">
                <div className="skeleton-base" style={{ width: '40%', height: '12px', marginBottom: '6px' }}></div>
                <div className="skeleton-base" style={{ width: '70%', height: '20px' }}></div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BookDetailSkeleton;