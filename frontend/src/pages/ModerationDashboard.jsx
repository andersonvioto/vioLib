import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import { AuthContext } from '../contexts/AuthContext';
import './ModerationDashboard.css';

const ModerationDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redireciona imediatamente se o utilizador não for admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/biblioteca');
    }
  }, [user, navigate]);

  const fetchReports = useCallback(async () => {
    await Promise.resolve();
    try {
      const response = await api.get('/moderation/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
      alert('Erro ao carregar o painel de moderação. Verifique a consola.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CORREÇÃO DO LINTER: Encapsulamento da chamada assíncrona para evitar cascading renders
  useEffect(() => {
    const initFetch = async () => {
      await fetchReports();
    };
    initFetch();
  }, [fetchReports]);

  const handleResolve = async (reportId, action, confirmMessage) => {
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.put(`/moderation/reports/${reportId}/resolve`, { action });
      // Atualiza a lista local para refletir o status resolvido
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r
        )
      );
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Erro ao processar moderação.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="mod-badge warning">Pendente</span>;
      case 'resolved':
        return <span className="mod-badge success">Resolvido (Ação Tomada)</span>;
      case 'dismissed':
        return <span className="mod-badge neutral">Ignorado (Falso Alarme)</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="profile-loading">
          <span className="material-symbols-rounded spinner-icon">sync</span> Carregando fila de
          moderação...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />

      <div className="mod-container">
        <header className="mod-header">
          <h1 className="mod-title">
            <span className="material-symbols-rounded">admin_panel_settings</span>
            Painel de Moderação (Trust & Safety)
          </h1>
          <p className="mod-subtitle">
            Reveja denúncias da comunidade e aplique as políticas de segurança.
          </p>
        </header>

        {reports.length === 0 ? (
          <div className="empty-msg" style={{ padding: '40px', background: 'var(--bg-surface)' }}>
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: '3em',
                display: 'block',
                marginBottom: '10px',
                color: 'var(--positive)'
              }}
            >
              verified
            </span>
            Não há denúncias na fila. A comunidade está segura!
          </div>
        ) : (
          <div className="mod-list">
            {reports.map((report) => {
              const isPending = report.status === 'pending';
              const targetIsProfile = !report.reportedCommentId && report.reportedUserId;

              return (
                <div
                  key={report.id}
                  className={`mod-card ${!isPending ? 'mod-card-resolved' : ''}`}
                >
                  <div className="mod-card-header">
                    <div className="mod-card-meta">
                      <strong>Denúncia #{report.id}</strong> • Feita por @
                      {report.Reporter?.username} em{' '}
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <div className="mod-card-body">
                    <div className="mod-reason-box">
                      <strong>Motivo alegado:</strong>
                      <p>{report.reason}</p>
                    </div>

                    <div className="mod-target-box">
                      <strong>Alvo da Denúncia:</strong>
                      {targetIsProfile ? (
                        <div className="mod-target-profile">
                          <span className="material-symbols-rounded">person</span>
                          Perfil: <strong>{report.ReportedUser?.name}</strong> (@
                          {report.ReportedUser?.username})
                        </div>
                      ) : (
                        <div className="mod-target-comment">
                          <span className="material-symbols-rounded">forum</span>
                          Comentário de <strong>{report.Comment?.User?.name}</strong>:
                          <blockquote>"{report.Comment?.content}"</blockquote>
                        </div>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="mod-card-actions">
                      <button
                        className="btn-action"
                        onClick={() =>
                          handleResolve(
                            report.id,
                            'dismiss',
                            'Tem certeza que deseja ignorar esta denúncia? Nenhuma ação será tomada.'
                          )
                        }
                      >
                        <span className="material-symbols-rounded">visibility_off</span> Ignorar
                        (Falso Alarme)
                      </button>

                      {!targetIsProfile && (
                        <button
                          className="btn-action btn-danger-outline"
                          onClick={() =>
                            handleResolve(
                              report.id,
                              'delete_comment',
                              'Apagar permanentemente este comentário?'
                            )
                          }
                        >
                          <span className="material-symbols-rounded">delete</span> Apagar Comentário
                        </button>
                      )}

                      <button
                        className="btn-action btn-danger"
                        onClick={() =>
                          handleResolve(
                            report.id,
                            'ban_user',
                            `Atenção: Tem certeza que deseja BANIR PERMANENTEMENTE o utilizador ${targetIsProfile ? report.ReportedUser?.name : report.Comment?.User?.name}? Ele perderá o acesso à conta imediatamente.`
                          )
                        }
                      >
                        <span className="material-symbols-rounded">block</span> Banir Utilizador
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
