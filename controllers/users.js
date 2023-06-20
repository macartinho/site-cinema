const User = require(`../models/user`);//modelo mongoose user

module.exports.registerForm = (req, res) => {//pagina com formulario de registro
    res.render('users/register');
};

module.exports.registerUser = async (req, res) => {//caminho para criar um novo usuario
    const { email, username, password } = req.body;
    const user = new User({ email, username, status: "pending", role: "user" });
    const registeredUser = await User.register(user, password); //criptografa com salt e salva no banco de dados
    req.login(registeredUser, err => {//faz login apos o registro
        if (err) return next(err);
        req.flash('success', 'Bem vindo!');
        res.redirect('/sessions');
    })};

module.exports.registerAdminForm = (req, res) => {//pagina com formulario de registro
    res.render('users/registeradmin');
};

module.exports.registerAdmin = async (req, res) => {//caminho para criar um novo usuario admin
    const { email, username, password } = req.body;
    const user = new User({ email, username, status: "pending", role: "admin" });
    const registeredUser = await User.register(user, password); //criptografa com salt e salva no banco de dados
    req.login(registeredUser, err => {//faz login apos o registro
        if (err) return next(err);
        req.flash('success', 'Bem vindo!');
        res.redirect('/movies');
    })};

module.exports.loginForm = (req, res) => {//rota para formulario de login
    if (req.query.redirect){
        req.flash('error', 'You must be logged on to add a movie.');
        req.session.returnTo = '/sessions/'+req.query.redirect+'/seat'
        return res.redirect('/login');
    }
    res.render('users/login');
};

module.exports.loginUser = (req, res) => { //rota que faz login de um usuario, compara o usuario e o hash da senha com um existente
    req.flash('success', 'Bem vindo!');
    const redirectUrl = req.session.returnTo || '/sessions';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logoutUser = (req, res) => {//rota de logout
    req.logout(function(err){
        if (err) {return next(err);}
    });
    res.redirect('/sessions');
};

module.exports.chairTest = (req, res) => {
    console.log(req.body);
    console.log('kill myself');
    res.send(`made it`)
};