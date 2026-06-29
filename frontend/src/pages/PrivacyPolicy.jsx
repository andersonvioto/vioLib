import { Link } from 'react-router-dom';
import logoImg from '../assets/violib-logo-full2.png'; 
import './PrivacyPolicy.css'; 

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <div className="policy-card">
        <header className="policy-header">
          <img src={logoImg} alt="vioLib" className="policy-logo" />
          <h1 className="policy-title">Política de Privacidade</h1>
          <div className="policy-date">Última atualização: {new Date().toLocaleDateString('pt-BR')}</div>
        </header>
        
        <div className="policy-content">
          <p>
            Bem-vindo ao <strong>vioLib</strong>. A sua privacidade é extremamente importante para nós. Esta Política de Privacidade explica como recolhemos, utilizamos, protegemos e partilhamos as suas informações quando utiliza a nossa plataforma de gestão de bibliotecas virtuais.
          </p>

          <h2>1. Dados que Recolhemos</h2>
          <p>
            Para fornecer os nossos serviços, recolhemos as seguintes informações:
          </p>
          <ul>
            <li><strong>Dados de Registo:</strong> Nome, endereço de e-mail e senha (armazenada de forma criptografada).</li>
            <li><strong>Dados da Biblioteca:</strong> Informações sobre os livros que adiciona, incluindo títulos, autores, géneros, capas, datas de aquisição e notas pessoais.</li>
            <li><strong>Dados de Utilização:</strong> Informações geradas automaticamente durante a navegação, necessárias para manter a segurança da sua sessão.</li>
          </ul>

          <h2>2. Como Utilizamos os seus Dados</h2>
          <p>
            Os dados recolhidos são utilizados exclusivamente para:
          </p>
          <ul>
            <li>Criar, autenticar e gerir a sua conta.</li>
            <li>Permitir que organize, edite e aceda à sua biblioteca pessoal a partir de qualquer dispositivo.</li>
            <li>Garantir a segurança da plataforma contra acessos não autorizados.</li>
            <li>Enviar comunicações essenciais, como links de recuperação de senha.</li>
          </ul>

          <h2>3. Partilha de Dados</h2>
          <p>
            <strong>Não vendemos, alugamos ou partilhamos os seus dados pessoais com terceiros</strong> para fins de marketing. As suas informações são armazenadas de forma segura em infraestruturas de nuvem de parceiros confiáveis (como servidores de base de dados), que também seguem rigorosos padrões de segurança.
          </p>

          <h2>4. Segurança da Informação</h2>
          <p>
            Implementamos medidas de segurança padrão da indústria para proteger as suas informações, incluindo o uso de criptografia de ponta a ponta (HTTPS) para a transferência de dados e algoritmos de <i>hashing</i> fortes para a proteção da sua senha. Ninguém da equipa do vioLib tem acesso à sua senha em texto claro.
          </p>

          <h2>5. Retenção e Exclusão de Dados</h2>
          <p>
            Mantemos os seus dados apenas enquanto a sua conta estiver ativa. Você tem o direito de solicitar a exclusão permanente da sua conta e de todos os dados associados a qualquer momento. Para obter instruções detalhadas, consulte a nossa <Link to="/excluir-conta" style={{color: 'var(--accent-gold)'}}>Página de Exclusão de Dados</Link>.
          </p>

          <h2>6. Contacto</h2>
          <p>
            Se tiver qualquer dúvida sobre esta Política de Privacidade ou sobre as nossas práticas de segurança, por favor entre em contacto connosco através do e-mail: <strong>suporte@violib.com.br</strong>
          </p>
        </div>

        <footer className="policy-footer">
          <Link to="/login" className="btn-back-home">
            <span className="material-symbols-rounded">arrow_back</span>
            Voltar para o Início
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;