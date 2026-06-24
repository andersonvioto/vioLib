const bcrypt = require('bcryptjs');
const { User } = require('../models');

/**
 * Busca os dados públicos do perfil do usuário logado.
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error("🕵️ ERRO NO USER CONTROLLER (GET PROFILE):", error);
    res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
  }
};

/**
 * Atualiza o nome e/ou a senha do usuário logado.
 * Exige a senha atual para autorizar alterações de senha.
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Processamento de alteração de senha
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para autorizar a alteração.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'A senha atual está incorreta.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Atualização de dados cadastrais
    if (name) {
      user.name = name;
    }

    await user.save();

    res.json({ 
      message: 'Perfil atualizado com sucesso!', 
      user: { name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error("🕵️ ERRO NO USER CONTROLLER (UPDATE PROFILE):", error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};