const ExpressError = require('./utils/ExpressError'); //funçao que extente a funçao Error para criar erros com mensagem e status dinamicos
const { movieSchema, sessionSchema } = require('./schemas.js'); //joi schema para validaçao de um objeto com dados do filme


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if(req.originalUrl=='/seats'){
            return res.redirect('/login');
        }
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Função exclusiva para membros.');
        return res.redirect('/login');
    }
    next();
}

module.exports.isLoggedInAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if(req.originalUrl=='/seats'){
            return res.redirect('/login');
        }
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Função exclusiva para membros.');
        return res.redirect('/login');
    }
    if(!(req.user.role==="admin")){
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Função exclusiva para administradores.');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateMovie = (req, res, next) => { //funçao middleware para validar dados no req.body com o schema joi
    const { error } = movieSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateSession = (req, res, next) => { //funçao middleware para validar dados no req.body com o schema joi
    req.body.session.location = req.body.location;
    delete req.body.location;
    const { error } = sessionSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}