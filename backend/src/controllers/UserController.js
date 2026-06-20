const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email'] // Traz apenas o necessário
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId; 
    const { name, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Se o usuário quer alterar a senha...
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Você precisa informar sua Senha Atual para autorizar a troca.' });
      }
      
      // Verifica se a senha atual está correta
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'A Senha Atual está incorreta.' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Atualiza o nome
    if (name) user.name = name;

    await user.save();

    res.json({ message: 'Perfil atualizado com sucesso!', user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("🕵️ ERRO NO USER CONTROLLER:", error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};