const express = require('express'); //pedindo framework express
const router = express.Router(); //cria objeto router pela funçao do express para lidar com os pedidos e exportalos
const catchAsync = require('../utils/catchAsync');//funçao wrapper para lidar com erros em funçoes async
const movies = require('../controllers/movies');//controles das rotas (logica)
const { isLoggedIn, validateMovie, isLoggedInAdmin } = require('../middleware.js');//middleware para rotas que precisam de usuario e para validar dados vindo de formularios
const multer = require('multer');
const {storage} = require('../cloudinary')
const upload = multer({storage})

//rota para pagina index de filmes
router.get('/', isLoggedInAdmin, catchAsync(movies.index));
//rota para pagina com formulario de novo filme
router.get('/new', isLoggedInAdmin, catchAsync(movies.newForm));
//rota de criaçao de um novo filme com validaçao JOI no req.body
router.post('/', isLoggedInAdmin, upload.array('image'), validateMovie,catchAsync(movies.newMovie));
//rota para pagina show de um filme
router.get('/:id', isLoggedInAdmin, catchAsync(movies.showMovie));
//rota para pagina com formulario para atualizar dados de um filme
router.get('/:id/edit', isLoggedInAdmin, catchAsync(movies.updateForm));
//rota para atualizar um filme com validaçao JOI
router.put('/:id', isLoggedInAdmin, upload.array('image'), validateMovie, catchAsync(movies.updateMovie));
//rota para deletar um filme (aciona middleware do modelo mongoose)
router.delete('/:id', isLoggedInAdmin, catchAsync(movies.deleteMovie));

module.exports = router; //exportando routers para serem acesados em outros arquivos