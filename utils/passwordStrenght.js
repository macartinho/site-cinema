const User = require(`../models/user`); //modelo mongoose
const passStrengthCheck = async (req, res, next) => { //funçao middleware para garantir senha forte
    try {
        const { email, username, password } = req.body;
        console.log(req.body)
        if (password.length < 7) {
            throw new Error('Senha deve ser no mínimo 8 caracteres.');
        }
        const valid_user = await User.findOne({$or:[{email: email}, {username: username} ]});
        if(valid_user){
            console.log(valid_user)
        if(valid_user.email == email){
            throw new Error('Email já existe.');
        }
        if(valid_user.username == username){
            throw new Error('Usuário já existe.');
        }}
        
        next();
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}
module.exports = passStrengthCheck;