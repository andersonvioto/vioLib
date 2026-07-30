import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { getCoverUrl } from '../utils/bookHelpers';

import BookDetailHeader from '../components/BookDetailHeader';
import LoanManager from '../components/LoanManager';
import BookMetadataGrid from '../components/BookMetadataGrid';
import BookDetailSkeleton from '../components/BookDetailSkeleton';
import ReportModal from '../components/ReportModal';

import './BookDetails.css';

const getAvatarUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
  return `${apiUrl.replace('/api', '/files')}/${filename}`;
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' anos atrás';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' meses atrás';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' dias atrás';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' horas atrás';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min atrás';
  return 'Agora mesmo';
};

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Estado UGC
  const [reportingComment, setReportingComment] = useState(null);

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

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/book/${id}`);
      setComments(response.data);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    }
  }, [id]);

  useEffect(() => {
    const loadPageData = async () => {
      await fetchBookDetails();
      await fetchComments();
    };

    loadPageData();
  }, [fetchBookDetails, fetchComments]);

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/comments/book/${id}`, { content: newComment });
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      alert('Erro ao enviar comentário.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Apagar este comentário?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Erro ao apagar comentário:', error);
      alert('Erro ao apagar o comentário.');
    }
  };

  if (!book) {
    return <BookDetailSkeleton />;
  }

  const activeLoan = book.Loans?.find((loan) => !loan.returnDate);

  return (
    <div className="details-container">
      {reportingComment && (
        <ReportModal targetComment={reportingComment} onClose={() => setReportingComment(null)} />
      )}

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

          <section className="comments-section" aria-label="Comentários da obra">
            <h2 className="comments-title">
              <span className="material-symbols-rounded">forum</span>
              Comentários ({comments.length})
            </h2>

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Deixe a sua opinião sobre este livro..."
                rows={3}
                disabled={isSubmittingComment}
              />
              <button
                type="submit"
                className="btn-action btn-primary"
                disabled={isSubmittingComment || !newComment.trim()}
              >
                {isSubmittingComment ? 'Enviando...' : 'Comentar'}
              </button>
            </form>

            <div className="comment-list">
              {comments.map((comment) => {
                const isMyComment = comment.UserId === user?.id;

                return (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.User?.avatarUrl ? (
                        <img src={getAvatarUrl(comment.User.avatarUrl)} alt="Avatar" />
                      ) : (
                        <div className="comment-initials">{getInitials(comment.User?.name)}</div>
                      )}
                    </div>

                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.User?.name}</span>
                        <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>

                      <div
                        className="comment-actions-bar"
                        style={{ display: 'flex', gap: '15px', marginTop: '8px' }}
                      >
                        {isMyComment && (
                          <button
                            className="btn-delete-comment"
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-danger)',
                              fontSize: '0.85em',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Apagar
                          </button>
                        )}
                        {!isMyComment && (
                          <button
                            onClick={() => setReportingComment(comment)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.85em',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            Denunciar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="comments-empty">Seja o primeiro a comentar nesta obra!</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BookDetails;
