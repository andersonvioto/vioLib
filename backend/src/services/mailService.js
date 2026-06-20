const { google } = require('googleapis');

// Configura o cliente OAuth2
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Redirect URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

// Instancia a API do Gmail
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Função auxiliar para codificar o e-mail no formato seguro exigido pelo Gmail
const makeBody = (to, from, subject, message) => {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    message,
  ].join('\n');

  // O Gmail exige Base64Url (sem +, / e =)
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

exports.sendVerificationEmail = async (userEmail, token) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verificar-email/${token}`;
    const myEmail = process.env.GMAIL_USER;

    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D4AF37;">Bem-vindo ao vioLib!</h2>
        <p>Ficamos muito felizes em ter você conosco.</p>
        <p>Para liberar seu acesso e começar a gerenciar sua biblioteca, clique no link abaixo para verificar sua conta:</p>
        <div style="margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verificar Meu E-mail
          </a>
        </div>
      </div>
    `;

    const rawMessage = makeBody(userEmail, myEmail, 'Bem-vindo ao vioLib! Confirme seu e-mail', emailHtml);

    // Dispara o e-mail via requisição HTTP (Bypass do bloqueio de porta do Render)
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    console.log("E-mail enviado via Gmail API! ID:", res.data.id);
    return res.data;
  } catch (error) {
    console.error("Erro crítico ao enviar via Gmail API:", error);
    throw error;
  }
};