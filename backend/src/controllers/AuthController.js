const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Genre, Subgenre, sequelize } = require('../models');
const mailService = require('../services/mailService');
const { OAuth2Client } = require('google-auth-library');

// Cliente do Google OAuth para o Login Social
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Constantes de domínio para configuração inicial de usuários.
 */
const DEFAULT_GENRES = [
  { name: 'Biografia', subgenres: [] },
  { name: 'Fantasia', subgenres: ['Fantasia Medieval', 'Fantasia Urbana', 'Fantasia Sombria'] },
  { name: 'Suspense', subgenres: ['Policial', 'Thriller Psicológico', 'Noir'] },
  {
    name: 'Ficção Científica',
    subgenres: ['Cyberpunk', 'Ópera Espacial', 'Viagem no Tempo', 'Distopia']
  },
  {
    name: 'Ficção Romântica',
    subgenres: ['Romance Contemporâneo', 'Romance de Época', 'Jovem Adulto', 'Romance de Fantasia']
  },
  {
    name: 'Terror',
    subgenres: ['Horror Sobrenatural', 'Terror Psicológico', 'Slasher', 'Horror Cósmico']
  },
  { name: 'Ficção Histórica', subgenres: [] },
  { name: 'Não Ficção', subgenres: ['Biografia', 'Crime Real', 'Autoajuda', 'História'] }
];

/**
 * Função auxiliar para montar a estrutura inicial da biblioteca do usuário.
 */
const initializeUserGenres = async (userId, transaction) => {
  await Promise.all(
    DEFAULT_GENRES.map(async (item) => {
      const genre = await Genre.create({ name: item.name, UserId: userId }, { transaction });
      if (item.subgenres.length > 0) {
        await Promise.all(
          item.subgenres.map((sub) =>
            Subgenre.create({ name: sub, GenreId: genre.id }, { transaction })
          )
        );
      }
    })
  );
};

/**
 * Registra um novo usuário no sistema e inicializa suas categorias padrão.
 */
exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, password, language } = req.body;

    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        language,
        verificationToken,
        isVerified: false
      },
      { transaction }
    );

    // Inicialização paralela de categorias para performance
    await initializeUserGenres(user.id, transaction);

    // MELHORIA CRUCIAL (Operação Atômica):
    // O e-mail é enviado ANTES de commitar a transação no banco.
    // Se o serviço de e-mail falhar, a execução pula direto para o catch(),
    // a transação sofre rollback e o usuário "preso" não é gravado no banco.
    try {
      await mailService.sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error(
        `📧 ERRO DETALHADO NO SERVIÇO DE E-MAIL (Registo - ${user.email}):`,
        emailError
      );
      throw emailError; // Re-lança o erro para forçar o rollback no catch principal
    }

    // Se o e-mail foi enviado com sucesso, consolidamos no banco de dados.
    await transaction.commit();

    res
      .status(201)
      .json({ message: 'Conta criada com sucesso! Verifique seu e-mail para ativar.' });
  } catch (error) {
    // PROTEÇÃO SÊNIOR: Apenas executa rollback se a transação ainda estiver pendente.
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('🕵️ ERRO NO AUTHCONTROLLER (REGISTER):', error);

    // Tratativa de UX mais clara para o usuário
    res.status(400).json({
      error:
        'Não foi possível enviar o e-mail de confirmação devido a uma instabilidade. O cadastro foi revertido, tente novamente em alguns instantes.'
    });
  }
};

/**
 * Autentica o usuário e gera um JWT.
 */
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Por favor, confirme seu e-mail antes de acessar.' });
    }

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn });

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHCONTROLLER (LOGIN):', error);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

/**
 * Autentica ou cadastra o usuário através do Token do Google.
 */
exports.googleLogin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { token } = req.body;

    // O Google valida a assinatura da credencial para garantir que não foi forjada
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ where: { email }, transaction });

    if (!user) {
      // Como usuários do Google não usam senha no nosso app, geramos uma hash aleatória forte
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create(
        {
          name,
          email,
          password: hashedPassword,
          isVerified: true, // Já validado pelo Google, pula validação de e-mail
          language: 'pt-BR'
        },
        { transaction }
      );

      await initializeUserGenres(user.id, transaction);
    }

    await transaction.commit();

    // Login via Google por padrão gera uma sessão de longa duração
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token: jwtToken });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('🕵️ ERRO NO AUTHCONTROLLER (GOOGLE):', error);
    res.status(500).json({ error: 'Falha ao autenticar com o Google.' });
  }
};

/**
 * Ativa a conta de usuário via token de e-mail.
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ error: 'Token de verificação inválido ou expirado.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: 'E-mail verificado com sucesso!' });
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHCONTROLLER (VERIFY):', error);
    res.status(500).json({ error: 'Erro interno ao verificar e-mail.' });
  }
};

/**
 * Envia link para redefinição de senha.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
      await user.save();

      try {
        await mailService.sendResetPasswordEmail(user.email, token);
      } catch (emailError) {
        console.error(
          `📧 ERRO DETALHADO NO SERVIÇO DE E-MAIL (Recuperação - ${user.email}):`,
          emailError
        );
        throw emailError;
      }
    }

    res.json({
      message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.'
    });
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHCONTROLLER (FORGOT):', error);
    res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
  }
};

/**
 * Redefine a senha do usuário utilizando token válido.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'O link de redefinição é inválido ou expirou.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('🕵️ ERRO NO AUTHCONTROLLER (RESET):', error);
    res.status(500).json({ error: 'Erro ao redefinir a senha.' });
  }
};
