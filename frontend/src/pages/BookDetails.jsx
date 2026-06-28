import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCoverUrl } from '../utils/bookHelpers';

// Sub-Componentes extraídos
import BookDetailHeader from '../components/BookDetailHeader';
import LoanManager from '../components/LoanManager';
import BookMetadataGrid from '../components/BookMetadataGrid';
import BookDetailSkeleton from '../components/BookDetailSkeleton'; 

import './BookDetails.css';

/**
 * Tela Principal de Detalhes da Obra.
 * Atua como orquestrador de estado global do livro e monta a estrutura visual da página.
 */
const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  const fetchBookDetails = useCallback(async () => {
    try {
      const response = await api.get(`/books/${id}`);
      setBook(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      alert('Livro não encontrado ou sem permissão de acesso.');
      navigate('/biblioteca');
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${book.title}" da sua biblioteca?`)) {
      try {
        await api.delete(`/books/${id}`);
        navigate('/biblioteca');
      } catch (error) {
        alert('Erro ao excluir o livro.');
      }
    }
  };

  // Trava de Segurança visual elegante (Skeleton Loading)
  if (!book) {
    return <BookDetailSkeleton />;
  }

  const activeLoan = book.Loans?.find(loan => !loan.returnDate);

  return (
    <div className="details-container">
      
      {/* 1. Componente de Cabeçalho Envelopado em Barra Fixa */}
      <div className="fixed-detail-header">
        <div className="fixed-detail-header-inner">
          <BookDetailHeader book={book} onDelete={handleDelete} />
        </div>
      </div>
      
      <div className="editorial-layout">
        
        {/* 2. Capa da Obra */}
        <div className="cover-wrapper">
          <img src={getCoverUrl(book.coverImage)} alt={book.title} className="details-cover" />
        </div>

        <div className="details-content">
          
          {/* 3. Título e Autores Principais */}
          <div>
            <h1 className="book-main-title">{book.title}</h1>
            <p className="book-main-authors">
              {book.Authors?.map(a => a.name).join(', ') || 'Autor Desconhecido'}
            </p>
          </div>

          {/* 4. Gerenciador de Empréstimos (Visível apenas para o Dono) */}
          {book.isOwner && (
            <LoanManager 
              bookId={book.id} 
              activeLoan={activeLoan} 
              onUpdate={fetchBookDetails} 
            />
          )}

          {/* 5. Metadados e Notas (Dumb Component) */}
          <BookMetadataGrid book={book} />

        </div>
      </div>
    </div>
  );
};

export default BookDetails;