import { Link } from 'react-router-dom';
import logoImg from '../assets/violib-logo-full2.png';
import './DeleteAccountInfo.css';

/**
 * Página pública exigida pelas políticas de Segurança de Dados.
 * Apresenta instruções claras e acessíveis sobre o processo de exclusão de conta.
 */
const DeleteAccountInfo = () => {
  return (
    <main className="delete-account-container">
      <section className="delete-account-card" aria-labelledby="delete-title">
        <img src={logoImg} alt="vioLib - Gestão Bibliográfica" className="delete-logo" />

        <h1 id="delete-title" className="delete-title">
          Exclusão de Conta e Dados
        </h1>

        <p className="delete-text">
          No <strong>vioLib</strong>, levamos a sua privacidade a sério. Se desejar encerrar a sua
          jornada conosco, você tem o direito de solicitar a exclusão permanente e irreversível da
          sua conta e de todos os dados associados a ela.
        </p>

        <div className="delete-warning" role="alert">
          <span className="material-symbols-rounded warning-icon" aria-hidden="true">
            warning
          </span>
          <div>
            <strong>Atenção:</strong> A exclusão da conta apagará permanentemente o seu perfil, toda
            a sua biblioteca de livros cadastrados, metadados (autores, gêneros), notas pessoais e
            histórico de empréstimos. Esta ação não poderá ser desfeita.
          </div>
        </div>

        <h2 className="delete-subtitle">Como solicitar a exclusão:</h2>

        <ul className="delete-instructions-list">
          <li>
            <strong>Pelo Aplicativo:</strong> Faça login na sua conta, navegue até{' '}
            <em>Configurações &gt; Meu Perfil</em> e clique em &quot;Desejo excluir minha
            conta&quot;. Será necessário confirmar com a sua senha atual por segurança.
          </li>
          <li>
            <strong>Por E-mail:</strong> Envie um e-mail para <strong>suporte@violib.com.br</strong>{' '}
            a partir do endereço de e-mail registrado na sua conta, solicitando a &quot;Exclusão de
            Conta&quot;. Os seus dados serão removidos integralmente no prazo de até 7 dias úteis.
          </li>
        </ul>

        <Link
          to="/login"
          className="btn-back-home"
          aria-label="Voltar para a tela de login inicial"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            arrow_back
          </span>
          <span>Voltar para o Início</span>
        </Link>
      </section>
    </main>
  );
};

export default DeleteAccountInfo;
