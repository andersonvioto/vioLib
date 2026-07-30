const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { User } = require('../models');

/**
 * Middleware de autenticação JWT.
 * Valida o token fornecido no header Authorization e injeta o userId no objeto req.
 * Bloqueia instantaneamente qualquer utilizador cuja role seja 'banned'.
 *
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {Function} next - Função para passar ao próximo middleware.
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // Verifica o formato "Bearer <token>"
  const [scheme, token] = authHeader.split(' ');

  if (!/^Bearer$/i.test(scheme) || !token) {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  try {
    // Verifica o token usando promisify para uma sintaxe mais limpa
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // SEGURANÇA EM TEMPO REAL: Garante que utilizadores recém-banidos perdem o acesso
    // mesmo que o JWT deles ainda esteja válido por tempo.
    const user = await User.findByPk(decoded.userId, { attributes: ['id', 'role'] });

    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado no sistema.' });
    }

    if (user.role === 'banned') {
      return res.status(403).json({
        error: 'A sua conta foi banida permanentemente por violação das políticas da comunidade.'
      });
    }

    // Injeta o ID do usuário na requisição para uso nos próximos controladores
    req.userId = user.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
