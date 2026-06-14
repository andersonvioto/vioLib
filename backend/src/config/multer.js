const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configura onde e como os arquivos serão salvos
module.exports = {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'uploads'), // Salva na pasta 'uploads' na raiz do backend
    filename: (req, file, cb) => {
      // Gera um código aleatório para evitar que duas capas com o mesmo nome se sobrescrevam
      const hash = crypto.randomBytes(8).toString('hex');
      const fileName = `${hash}-${file.originalname.replace(/\s/g, '_')}`;
      cb(null, fileName);
    }
  })
};