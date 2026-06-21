const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize'); // Necessário para checar a validade do token de tempo
const { User, Genre, Subgenre } = require('../models');
const mailService = require('../services/mailService');

// Lista padrão fornecida por você
const defaultGenres = [
  { name: 'Biografia', subgenres: [] },
  { name: 'Fantasia', subgenres: ['Fantasia Medieval', 'Fantasia Urbana', 'Fantasia Sombria'] },
  { name: 'Suspense', subgenres: ['Policial', 'Thriller Psicológico', 'Noir'] },
  { name: 'Ficção Científica', subgenres: ['Cyberpunk', 'Ópera Espacial', 'Viagem no Tempo', 'Distopia'] },
  { name: 'Ficção Romântica', subgenres: ['Romance Contemporâneo', 'Romance de Época', 'Jovem Adulto', 'Romance de Fantasia'] },
  { name: 'Terror', subgenres: ['Horror Sobrenatural', 'Terror Psicológico', 'Slasher', 'Horror Cósmico'] },
  { name: 'Ficção Histórica', subgenres: [] },
  { name: 'Não Ficção', subgenres: ['Biografia', 'Crime Real', 'Autoajuda', 'História'] }
];

exports.register = async (req, res) => {
  try {
    const { name, email, password, language } = req.body;
    
    // 1. CHECAGEM DE DUPLICIDADE
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // 2. Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Geração do token de validação de e-mail
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Cria o usuário no banco (isVerified entra como falso por padrão)
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      language,
      verificationToken,
      isVerified: false
    });
    
    // 5. Injeta a lista de gêneros e subgêneros exclusiva do usuário
    for (const item of defaultGenres) {
      const genre = await Genre.create({ name: item.name, UserId: user.id });
      for (const sub of item.subgenres) {
        await Subgenre.create({ name: sub, GenreId: genre.id });
      }
    }

    // 6. Envio de E-mail de Confirmação
    await mailService.sendVerificationEmail(user.email, verificationToken);
    
    res.status(201).json({ message: 'Conta criada com sucesso! Verifique sua caixa de entrada para ativar o acesso.' });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER CONTROLLER:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    // Passo 1: Recebemos o 'rememberMe' vindo do formulário do Front-end
    const { email, password, rememberMe } = req.body;
    
    // Busca o usuário pelo e-mail
    const user = await User.findOne({ where: { email } });
    
    // Compara a senha digitada com a criptografada no banco
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    // TRAVA DE SEGURANÇA: Bloqueia login se e-mail não for verificado
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Por favor, confirme seu e-mail antes de fazer login.' });
    }

    // Passo 2: Definimos a expiração do token dinamicamente
    // Se 'rememberMe' for true, token dura 30 dias. Se for false, dura apenas 1 dia.
    const expiresIn = rememberMe ? '30d' : '1d';

    // Passo 3: Gera o token de acesso aplicando a variável expiresIn
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: expiresIn } // <- Aqui aplicamos o tempo configurado
    );
    
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER CONTROLLER:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// FUNÇÕES DE SEGURANÇA (Verificação e Senha)
// ==========================================

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Link de verificação inválido ou expirado.' });
    }

    // Ativa o usuário e limpa o token
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: 'E-mail verificado com sucesso! Você já pode fazer login.' });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao verificar e-mail.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Por segurança, sempre retornamos a mesma mensagem mesmo se o e-mail não existir
    if (!user) {
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    // O token expira em 1 hora (3600000 ms)
    user.resetPasswordExpires = new Date(Date.now() + 3600000); 
    await user.save();

    await mailService.sendResetPasswordEmail(user.email, token);
    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.' });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao processar a recuperação de senha.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() } // Maior que a data atual
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'O link de redefinição é inválido ou expirou.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'A sua senha foi redefinida com sucesso!' });
  } catch (error) {
    console.error("🕵️ ERRO NO AUTHCONTROLLER CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao redefinir a senha.' });
  }
};