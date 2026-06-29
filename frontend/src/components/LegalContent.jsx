/**
 * Fonte Única da Verdade para os textos legais.
 * Estes componentes podem ser renderizados dentro de Modais ou em Páginas inteiras.
 */

export const TermsContent = () => (
  <div className="legal-content-body">
    <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
    
    <h3>1. Aceitação e Uso do Serviço</h3>
    <p>
      A vioLib é uma plataforma projetada para a gestão pessoal de bibliotecas. 
      Ao criar uma conta, você concorda em utilizar a plataforma de forma ética e exclusivamente para os fins a que se destina.
    </p>

    <h3>2. Responsabilidades da Conta</h3>
    <p>
      Você é responsável por manter a confidencialidade das suas credenciais de acesso (e-mail e senha). 
      Qualquer atividade realizada sob a sua conta é de sua inteira responsabilidade.
    </p>

    <h3>3. Propriedade Intelectual e Dados</h3>
    <p>
      O código-fonte, design, logotipos e interface da vioLib são de nossa propriedade exclusiva. 
      No entanto, <strong>todos os dados dos livros, notas e registros que você inserir no sistema pertencem exclusivamente a você.</strong>
    </p>

    <h3>4. Cancelamento e Exclusão</h3>
    <p>
      Você tem total liberdade para encerrar sua conta a qualquer momento. Ao solicitar a exclusão, 
      todos os seus dados pessoais e registros de livros serão apagados permanentemente de nossos servidores.
    </p>

    <h3>5. Modificações dos Termos</h3>
    <p>
      Podemos atualizar estes Termos de Serviço periodicamente. Notificaremos os usuários ativos 
      sobre mudanças significativas através do e-mail cadastrado.
    </p>
  </div>
);

export const PrivacyContent = () => (
  <div className="legal-content-body">
    <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
    
    <h3>1. Dados que Coletamos</h3>
    <p>
      Para o funcionamento da plataforma, coletamos apenas o estritamente necessário: <strong>seu Nome e E-mail</strong>. 
      Se você utilizar o login social (Google), receberemos essas mesmas informações básicas do seu perfil público.
    </p>

    <h3>2. Como Usamos seus Dados</h3>
    <p>
      Seus dados são utilizados exclusivamente para:
      <br/>• Criar e autenticar a sua conta de acesso.
      <br/>• Enviar e-mails transacionais necessários (como recuperação de senha ou verificação de conta).
      <br/>• Personalizar a sua experiência dentro do painel da biblioteca.
    </p>

    <h3>3. Compartilhamento de Dados</h3>
    <p>
      <strong>Nós não vendemos, alugamos ou repassamos seus dados pessoais para terceiros</strong> para fins publicitários ou comerciais. 
      Seus dados trafegam apenas pela infraestrutura de nuvem necessária para manter o aplicativo no ar com segurança.
    </p>

    <h3>4. Segurança</h3>
    <p>
      Utilizamos protocolos de criptografia padrão da indústria (como senhas com hash seguro e JWT) 
      para proteger suas informações contra acessos não autorizados.
    </p>

    <h3>5. Seus Direitos e Exclusão</h3>
    <p>
      Em conformidade com a LGPD e regulamentações globais, você possui o direito de baixar, 
      corrigir ou solicitar a <strong>exclusão total e irrecuperável</strong> dos seus dados a qualquer momento diretamente pelas configurações do aplicativo.
    </p>
  </div>
);