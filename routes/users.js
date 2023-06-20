const express = require('express');//pedindo framework express
const router = express.Router();//cria objeto router pela funçao do express para lidar com os pedidos e exportalos
const passStrengthCheck = require('../utils/passwordStrenght');//utilidade middleware para restringir os tipos de senha criadas e checar se email e usuario sao unicos
const catchAsync = require('../utils/catchAsync');//funçao wrapper para lidar com erros em funçoes async
const passport = require('passport');//pedindo modulo de autenticasao passport
const { isLoggedIn, isLoggedInAdmin } = require('../middleware.js');//middleware para checar se existe usuario logado na sessao
const users = require('../controllers/users');//controles das rotas (logica)

//pagina com formulario de registro
router.get('/register', users.registerForm);
//caminho para criar um novo usuario
router.post('/register', passStrengthCheck, catchAsync(users.registerUser));
//pagina com formulario de registro
router.get('/registerAdmin', isLoggedInAdmin, users.registerAdminForm);
//caminho para criar um novo usuario admin
router.post('/registerAdmin', isLoggedInAdmin, passStrengthCheck, catchAsync(users.registerAdmin));
//rota para formulario de login
router.get('/login', users.loginForm);
//rota que faz login de um usuario, compara o usuario e o hash da senha com um existente
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }), users.loginUser);
//rota de logout
router.get('/logout', users.logoutUser);

router.post('/chairTest', users.chairTest);

router.get('/credentials', isLoggedIn, (req, res) => {
    res.render('users/credentials');
});

module.exports = router;//export as rotas