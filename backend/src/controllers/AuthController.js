const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Genre, Subgenre, sequelize } = require('../models');
const mailService = require('../services/mailService');

/**
 * Constantes de domínio para configuração inicial de usuários.
 */
const DEFAULT_GENRES = [
  { name: 'Biografia', subgenres: [] },
  { name: 'Fantasia', subgenres: ['Fantasia Medieval', 'Fantasia Urbana', 'Fantasia Sombria'] },
  { name: 'Suspense', subgenres: ['Policial', 'Thriller Psicológico', 'Noir'] },
  { name: 'Ficção Científica', subgenres: ['Cyberpunk', 'Ópera Espacial', 'Viagem no Tempo', 'Distopia'] },
  { name: 'Ficção Romântica', subgenres: ['Romance Contemporâneo', 'Romance de Época', 'Jovem Adulto', 'Romance de Fantasia'] },
  { name: 'Terror', subgenres: ['Horror Sobrenatural', 'Terror Psicológico', 'Slasher', 'Horror Cósmico'] },
  { name: 'Ficção Histórica', subgenres: [] },
  { name: 'Não Ficção', subgenres: ['Biografia', 'Crime Real', 'Autoajuda', 'História'] }
];

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

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      language,
      verificationToken,
      isVerified: false
    }, { transaction });

    // Inicialização paralela de categorias para performance
    await Promise.all(DEFAULT_GENRES.map(async (item) => {
      const genre = await Genre.create({ name: item.name, UserId: user.id }, { transaction });
      if (item.subgenres.length > 0) {
        await Promise.all(item.subgenres.map(sub => 
          Subgenre.create({ name: sub, GenreId: genre.id }, { transaction })
        ));
      }
    }));

    await transaction.commit();
    await mailService.sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({ message: 'Conta criada com sucesso! Verifique seu e-mail para ativar.' });
  } catch (error) {
    await transaction.rollback();
    console.error("🕵️ ERRO NO AUTHCONTROLLER (REGISTER):", error);
    res.status(400).json({ error: 'Erro ao processar registro: ' + error.message });
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
    console.error("🕵️ ERRO NO AUTHCONTROLLER (LOGIN):", error);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
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
    console.error("🕵️ ERRO NO AUTHCONTROLLER (VERIFY):", error);
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
      await mailService.sendResetPasswordEmail(user.email, token);
    }

    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.' });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER (FORGOT):", error);
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
    console.error("🕵️ ERRO NO AUTHCONTROLLER (RESET):", error);
    res.status(500).json({ error: 'Erro ao redefinir a senha.' });
  }
};