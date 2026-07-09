const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configura as credenciais do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configura o armazenamento direto na nuvem
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'violib_covers', // Nome da pasta que será criada lá no Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] // Formatos aceites
    // Opcional: transformation: [{ width: 500, height: 750, crop: 'limit' }] // Pode otimizar o tamanho na hora do upload!
  }
});

module.exports = { storage };
