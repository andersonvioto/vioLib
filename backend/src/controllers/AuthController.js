const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Genre, Subgenre } = require('../models');

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
    
    // 1. Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Cria o usuário no banco
    const user = await User.create({ name, email, password: hashedPassword, language });
    
    // 3. Injeta a lista de gêneros e subgêneros exclusiva do usuário
    for (const item of defaultGenres) {
      const genre = await Genre.create({ name: item.name, UserId: user.id });
      for (const sub of item.subgenres) {
        await Subgenre.create({ name: sub, GenreId: genre.id });
      }
    }

    // 4. Gera o token de acesso (login automático após cadastro)
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Busca o usuário pelo e-mail
    const user = await User.findOne({ where: { email } });
    
    // Compara a senha digitada com a criptografada no banco
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    // Gera o token de acesso
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};