import { useNavigate } from 'react-router-dom';
import { getCoverUrl } from '../utils/bookHelpers';
import './BookCard.css';

/**
 * Componente visual de um cartão de livro individual.
 * Suporta o modo "Padrão" (Flat) e o modo "Livro Realista" (3D).
 */
const BookCard = ({ book, showTags }) => {
  const navigate = useNavigate();
  const isBorrowed = book.Loans?.some(loan => !loan.returnDate);
  const authorName = book.Authors?.length > 0 ? book.Authors[0].name : 'Autor Desconhecido';

  return (
    <div className="book-card" onClick={() => navigate(`/livro/${book.id}`)}>
      
      {/* 
        ENVÓLUCRO DA CAPA
        No modo 3D, este wrapper ganha perspectiva para criar profundidade.
      */}
      <div className="book-cover-wrapper">
        
        {/* 
          O VOLUME DO LIVRO (O Objeto 3D)
          Contém as faces do livro: Frente, Trás, Lombada e Páginas.
        */}
        <div className="book-volume">
          {/* Capa Traseira (Dá peso e volume ao livro) */}
          <div className="book-back"></div>
          
          {/* Lateral Direita (Simula o bloco de folhas de papel) */}
          <div className="book-pages"></div>
          
          {/* Lateral Esquerda (A lombada física do livro) */}
          <div className="book-spine"></div>
          
          {/* Capa Frontal (A imagem enviada ou o SVG padrão) */}
          <img 
            src={getCoverUrl(book.coverImage)} 
            alt={book.title} 
            className="book-cover-img" 
          />
          
          {/* Overlay Brilhante (Simula o reflexo da luz numa capa plastificada) */}
          <div className="book-cover-overlay"></div>
        </div>

      </div>
      
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{authorName}</p>
        
        {showTags && book.Tags?.length > 0 && (
          <div className="card-tags-container">
            {book.Tags.slice(0, 2).map(tag => (
              <span key={tag.id} className="card-tag-chip">
                #{tag.name}
              </span>
            ))}
            {book.Tags.length > 2 && (
              <span className="card-tag-more">+{book.Tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      
      {isBorrowed && (
        <span className="badge-borrowed" title="Emprestado">
          <span className="material-symbols-rounded">schedule</span>
        </span>
      )}
    </div>
  );
};

export default BookCard;