const jwt = require('jsonwebtoken');
const { promisify } = require('util');

/**
 * Middleware de autenticação JWT.
 * Valida o token fornecido no header Authorization e injeta o userId no objeto req.
 * * @param {Object} req - Objeto de requisição do Express.
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

    // Injeta o ID do usuário na requisição para uso nos próximos controladores
    req.userId = decoded.userId;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
