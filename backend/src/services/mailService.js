const { google } = require('googleapis');

// Configuração do Cliente OAuth2
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

/**
 * Codifica o e-mail no formato MIME/Base64Url exigido pela Gmail API.
 */
const encodeMessage = (to, from, subject, message) => {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    message,
  ].join('\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Função interna para disparar a requisição à API do Gmail.
 */
const sendEmail = async (to, subject, htmlContent) => {
  const rawMessage = encodeMessage(to, process.env.GMAIL_USER, subject, htmlContent);
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: rawMessage },
  });
  return response.data;
};

/**
 * Envia o e-mail de verificação de conta.
 */
exports.sendVerificationEmail = async (userEmail, token) => {
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-email/${token}`;
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D4AF37;">Bem-vindo ao vioLib!</h2>
      <p>Para liberar seu acesso, clique no link abaixo:</p>
      <a href="${verifyLink}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Verificar E-mail
      </a>
    </div>
  `;
  return sendEmail(userEmail, 'Confirme seu e-mail no vioLib', html);
};

/**
 * Envia o e-mail de recuperação de senha.
 */
exports.sendResetPasswordEmail = async (userEmail, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha/${token}`;
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D4AF37;">Recuperação de Senha</h2>
      <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para prosseguir:</p>
      <a href="${resetLink}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Redefinir Senha
      </a>
      <p style="font-size: 0.8em; color: #888; margin-top: 20px;">Se você não solicitou isso, ignore este e-mail.</p>
    </div>
  `;
  return sendEmail(userEmail, 'Recupere sua senha no vioLib', html);
};