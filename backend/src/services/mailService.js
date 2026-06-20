const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // smtp.gmail.com
  port: parseInt(process.env.MAIL_PORT, 10), // 465
  secure: true, // true para porta 465, false para outras portas
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Envia o link de verificação de conta após o registro
 */
exports.sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${baseUrl}/verificar-email/${token}`;

  await transporter.sendMail({
    from: '"vioLib Admin" <noreply@violib.com>',
    to: email,
    subject: 'Ative sua conta no vioLib 📖',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #D4AF37; font-family: serif;">Seja bem-vindo ao vioLib!</h2>
        <p>Agradecemos o seu registo. Para garantir a segurança da plataforma, precisamos de validar se este e-mail é legítimo.</p>
        <p style="margin: 30px 0;">
          <a href="${url}" style="background-color: #D4AF37; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
            Confirmar o meu E-mail
          </a>
        </p>
        <p style="font-size: 0.85em; color: #aaaaaa;">Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
        <p style="font-size: 0.85em; color: #D4AF37; word-break: break-all;">${url}</p>
      </div>
    `,
  });
};

/**
 * Envia o link para redefinir a senha
 */
exports.sendResetPasswordEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${baseUrl}/redefinir-senha/${token}`;

  await transporter.sendMail({
    from: '"vioLib Segurança" <security@violib.com>',
    to: email,
    subject: 'Recuperação de Senha - vioLib 🔒',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #D4AF37; font-family: serif;">Redefinição de Senha</h2>
        <p>Recebemos um pedido para alterar a senha da sua conta.</p>
        <p>Se não realizou este pedido, pode ignorar este e-mail em segurança.</p>
        <p style="margin: 30px 0;">
          <a href="${url}" style="background-color: #D4AF37; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
            Alterar Senha
          </a>
        </p>
        <p style="font-size: 0.85em; color: #aaaaaa;">Este link é válido por apenas 1 hora.</p>
        <p style="font-size: 0.85em; color: #D4AF37; word-break: break-all;">${url}</p>
      </div>
    `,
  });
};