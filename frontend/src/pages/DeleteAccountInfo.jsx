import { Link } from 'react-router-dom';
import logoImg from '../assets/violib-logo-full.png'; 
import './DeleteAccountInfo.css'; 

/**
 * Página pública exigida pelas políticas de Segurança de Dados do Google Play Console.
 * Informa ao usuário como ele pode solicitar a exclusão total dos seus dados do sistema.
 */
const DeleteAccountInfo = () => {
  return (
    <div className="delete-account-container">
      <div className="delete-account-card">
        <img src={logoImg} alt="vioLib" className="delete-logo" />
        
        <h1 className="delete-title">Exclusão de Conta e Dados</h1>
        
        <p className="delete-text">
          No <strong>vioLib</strong>, levamos a sua privacidade a sério. Se desejar encerrar a sua jornada connosco, você tem o direito de solicitar a exclusão permanente e irreversível da sua conta e de todos os dados associados a ela.
        </p>

        <div className="delete-warning">
          <strong>Atenção:</strong> A exclusão da conta apagará permanentemente o seu perfil, toda a sua biblioteca de livros cadastrados, metadados (autores, géneros), notas pessoais e histórico de empréstimos. Esta ação não poderá ser desfeita.
        </div>

        <p className="delete-text" style={{ fontWeight: 'bold' }}>
          Como excluir a sua conta:
        </p>

        <ul className="delete-instructions-list">
          <li>
            <strong>Pelo Aplicativo:</strong> Faça login na sua conta, navegue até <em>Configurações &gt; Segurança</em> e clique em "Desejo excluir minha conta". Será necessário confirmar com a sua senha atual.
          </li>
          <li>
            <strong>Por E-mail:</strong> Envie um e-mail para <strong>suporte@violib.com.br</strong> a partir do endereço de e-mail registado na sua conta, solicitando a "Exclusão de Conta". Os seus dados serão apagados no prazo de até 7 dias úteis.
          </li>
        </ul>

        <Link to="/login" className="btn-back-home">
          <span className="material-symbols-rounded">arrow_back</span>
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
};

export default DeleteAccountInfo;