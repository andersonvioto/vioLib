import { useState } from 'react';
import api from '../services/api';
import './ReportModal.css';

/**
 * Modal Unificado para Denúncias de Usuários ou Comentários
 */
const ReportModal = ({ targetUser, targetComment, onClose }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        reason: reason.trim(),
        reportedUserId: targetUser ? targetUser.id : null,
        reportedCommentId: targetComment ? targetComment.id : null
      };

      const res = await api.post('/reports', payload);
      setFeedback({ type: 'success', message: res.data.message });

      // Fecha o modal após 2 segundos em caso de sucesso
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Erro ao enviar a denúncia. Tente novamente.'
      });
      setIsSubmitting(false);
    }
  };

  const isUserReport = !!targetUser;
  const targetName = isUserReport ? targetUser.name : targetComment?.User?.name;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-box" onClick={(e) => e.stopPropagation()}>
        <header className="report-modal-header">
          <h2 className="report-title">
            <span className="material-symbols-rounded">gavel</span>
            Denunciar {isUserReport ? 'Perfil' : 'Comentário'}
          </h2>
          <button type="button" className="btn-close-report" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="report-target-info">
            <strong>Alvo:</strong> {targetName}
            {!isUserReport && (
              <blockquote className="report-comment-preview">"{targetComment.content}"</blockquote>
            )}
          </div>

          <p className="report-instructions">
            Por favor, descreva detalhadamente por que este{' '}
            {isUserReport ? 'usuário' : 'comentário'}
            viola as nossas políticas (ex: Spam, Linguagem Ofensiva, Assédio, Conteúdo Inadequado).
          </p>

          {feedback && <div className={`report-feedback ${feedback.type}`}>{feedback.message}</div>}

          <textarea
            className="form-textarea report-textarea"
            placeholder="Descreva o motivo da sua denúncia..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting || feedback?.type === 'success'}
            required
            rows="4"
          ></textarea>

          <div className="report-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-action btn-danger"
              disabled={isSubmitting || !reason.trim() || feedback?.type === 'success'}
            >
              {isSubmitting ? 'A enviar...' : 'Enviar Denúncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
