import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCoverUrl } from '../utils/bookHelpers';

import BookDetailHeader from '../components/BookDetailHeader';
import LoanManager from '../components/LoanManager';
import BookMetadataGrid from '../components/BookMetadataGrid';
import BookDetailSkeleton from '../components/BookDetailSkeleton';

import './BookDetails.css';

/**
 * Tela Principal de Detalhes da Obra.
 * Orquestra o estado global do livro e monta a estrutura visual editorial.
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookDetails();
  }, [fetchBookDetails]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${book.title}" da sua biblioteca?`)) {
      try {
        await api.delete(`/books/${id}`);
        navigate('/biblioteca');
      } catch (error) {
        console.error('Erro de exclusão:', error);
        alert('Erro ao excluir o livro.');
      }
    }
  };

  if (!book) {
    return <BookDetailSkeleton />;
  }

  const activeLoan = book.Loans?.find((loan) => !loan.returnDate);

  return (
    <div className="details-container">
      <div className="fixed-detail-header">
        <div className="fixed-detail-header-inner">
          <BookDetailHeader book={book} onDelete={handleDelete} />
        </div>
      </div>

      <main className="editorial-layout" aria-label={`Detalhes da obra ${book.title}`}>
        <div className="cover-wrapper">
          <img
            src={getCoverUrl(book.coverImage)}
            alt={`Capa do livro ${book.title}`}
            className="details-cover"
          />
        </div>

        <div className="details-content">
          <header className="book-main-header">
            <h1 className="book-main-title">{book.title}</h1>
            <p className="book-main-authors">
              {book.Authors?.map((a) => a.name).join(', ') || 'Autor Desconhecido'}
            </p>

            <div className="book-status-badges" role="list" aria-label="Status bibliográfico">
              {book.readingStatus === 'reading' && (
                <span className="detail-badge reading" role="listitem" title="A ler atualmente">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    import_contacts
                  </span>
                  <span>Lendo</span>
                </span>
              )}
              {book.readingStatus === 'read' && (
                <span className="detail-badge read" role="listitem" title="Leitura concluída">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    task_alt
                  </span>
                  <span>Lido</span>
                </span>
              )}
              {book.readingStatus === 'unread' && (
                <span className="detail-badge unread" role="listitem" title="Ainda não lido">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    book
                  </span>
                  <span>Não Lido</span>
                </span>
              )}
              {activeLoan && (
                <span
                  className="detail-badge borrowed"
                  role="listitem"
                  title="Emprestado no momento"
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    schedule
                  </span>
                  <span>Emprestado</span>
                </span>
              )}
            </div>
          </header>

          <section className="metadata-section" aria-label="Ficha técnica e metadados">
            <BookMetadataGrid book={book} />
          </section>

          {book.isOwner && (
            <section className="loan-section" aria-label="Gestão de empréstimos">
              <LoanManager bookId={book.id} activeLoan={activeLoan} onUpdate={fetchBookDetails} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookDetails;
