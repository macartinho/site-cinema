const express = require('express'); //pedindo framework express
const router = express.Router(); //cria objeto router pela funçao do express para lidar com os pedidos e exportalos
const catchAsync = require('../utils/catchAsync');//funçao wrapper para ligar com erros em funçoes async
const { isLoggedIn, validateSession, isLoggedInAdmin } = require('../middleware.js');
const sessions = require('../controllers/sessions');//controles das rotas (logica)

//rota para pagina de index de seçoes
router.get('/', catchAsync(sessions.index))
//rota para pagina com formulario para criar nova seçao
router.get('/new', isLoggedInAdmin, catchAsync(sessions.newForm))
//rota para criar nova seçao e suas relaçoes com validaçao JOI
router.post('/', isLoggedInAdmin, validateSession, catchAsync(sessions.newSession))
//rota para pagina show de uma seçao
router.get('/:id', catchAsync(sessions.showSession))


router.get('/:id/seatDetails', isLoggedInAdmin, catchAsync(sessions.sessionDetails));
router.get('/:id/session', isLoggedInAdmin, catchAsync(sessions.showRoom));
//rota para pagina de ediçao de uma seçao
router.get('/:id/edit', isLoggedInAdmin, catchAsync(sessions.updateForm))

router.put('/seat/:id', isLoggedInAdmin, catchAsync(sessions.addSeat));
// rota para atualizar uma seçao com validaçao JOI
router.put('/:id', isLoggedInAdmin, validateSession, catchAsync(sessions.updateSession));

router.put('/:id/seat', isLoggedIn, catchAsync(sessions.updateSeat));
//rota para a pagina de assentos
router.get('/:id/seat', isLoggedIn, catchAsync(sessions.seats));


router.delete('/user/:id', isLoggedInAdmin, catchAsync(sessions.deleteRentedUser));
router.delete('/seat/:id', isLoggedIn, catchAsync(sessions.deleteSeat));
//rota para deletar uma seçao (ativa middleware de modelo mongoose)
router.delete('/:id', isLoggedIn, catchAsync(sessions.deleteSession));

router.post('/checkChange', catchAsync(sessions.checkChange));
router.post('/seatData', catchAsync(sessions.seatData));

module.exports = router; //exportando routers para serem acesados em outros arquivos