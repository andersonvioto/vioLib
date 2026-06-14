const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // O padrão esperado é "Bearer <token_aqui>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado.' });
  }

  // Verifica se o token é verdadeiro e não expirou
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // Injeta o ID do usuário na requisição.
    // Assim, sabemos exatamente QUEM está tentando salvar um livro.
    req.userId = decoded.userId; 
    
    return next(); // Libera o acesso para a rota que o usuário queria acessar
  });
};