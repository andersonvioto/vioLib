const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');

/**
 * Busca os dados públicos e privados do perfil do usuário logado.
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: [
        'id',
        'name',
        'email',
        'username',
        'avatarUrl',
        'shareCollections',
        'shareReadingStatus',
        'shareNotes'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (error) {
    console.error('🕵️ ERRO NO USER CONTROLLER (GET PROFILE):', error);
    res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
  }
};

/**
 * Atualiza os dados cadastrais, avatar, preferências sociais e senha do usuário.
 */
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      username,
      currentPassword,
      newPassword,
      shareCollections,
      shareReadingStatus,
      shareNotes
    } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Validação de Username (Apenas letras minúsculas, números, pontos e underscores)
    if (username) {
      const cleanUsername = username.toLowerCase().trim();
      const usernameRegex = /^[a-z0-9_.-]+$/;

      if (!usernameRegex.test(cleanUsername)) {
        return res.status(400).json({
          error: 'O username só pode conter letras minúsculas, números, pontos e underscores.'
        });
      }

      // Verifica se o username já está em uso por OUTRA pessoa
      const existingUser = await User.findOne({
        where: {
          username: cleanUsername,
          id: { [Op.ne]: req.userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Este nome de utilizador já está em uso.' });
      }

      user.username = cleanUsername;
    }

    // Processamento de Senha
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: 'Senha atual é obrigatória para autorizar a alteração.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(403).json({ error: 'A senha atual está incorreta.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Processamento de Dados Textuais
    if (name) user.name = name;

    // Processamento de Imagem (Avatar)
    if (req.file) {
      user.avatarUrl = req.file.path;
    }

    // Processamento Rigoroso de Booleanos via FormData (Que os converte em String)
    if (shareCollections !== undefined) {
      user.shareCollections = shareCollections === 'true' || shareCollections === true;
    }
    if (shareReadingStatus !== undefined) {
      user.shareReadingStatus = shareReadingStatus === 'true' || shareReadingStatus === true;
    }
    if (shareNotes !== undefined) {
      user.shareNotes = shareNotes === 'true' || shareNotes === true;
    }

    await user.save();

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('🕵️ ERRO NO USER CONTROLLER (UPDATE PROFILE):', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

/**
 * Exclui a conta do usuário logado mediante confirmação da senha.
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!password) {
      return res
        .status(400)
        .json({ error: 'A senha é obrigatória para confirmar a exclusão da conta.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(403)
        .json({ error: 'Senha incorreta. A exclusão foi cancelada por segurança.' });
    }

    await user.destroy();

    res.json({ message: 'Conta e dados associados foram excluídos com sucesso.' });
  } catch (error) {
    console.error('🕵️ ERRO NO USER CONTROLLER (DELETE ACCOUNT):', error);
    res.status(500).json({ error: 'Erro interno ao excluir a conta.' });
  }
};
