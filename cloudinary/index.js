const cloudinary = require('cloudinary').v2; //modulo cloudinary para salvar arquivos na nuvem cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); //modulo para fazer upload no cloudinary e arquivos que o multer pega do formulario

cloudinary.config({ //configuraçao da instancia cloudinary com informaçoes sigilosas
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({ //instancia cloudinary
    cloudinary,
    params: {
    folder: 'tccSiteImages',
    allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
}