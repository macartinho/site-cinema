const mongoose = require(`mongoose`);//Pedindo funçoes do modulo mongoose
const Schema = mongoose.Schema;//Definiçao para abreviamento
const passportLocalMongoose = require(`passport-local-mongoose`); //estrategia local mongoose do modulo passport para autenticaçao de usuarios e segurança

//schema do coleçao que sera criado no mongodb
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    status: { //estado da verificaçao de email
        type: String,
        enum: ['pending', "active"]
    },
    role: { //tipo de usuario
        type: String,
        enum: ['admin', 'user']
    },
    rentedChair: [{
        type: Schema.Types.ObjectId,
        ref: 'Seat'
    }]
});
UserSchema.plugin(passportLocalMongoose); //plugin para o schema que adiciona o nome do usuario e a senha criptografada (com hash e salt) no schema

module.exports = mongoose.model(`User`, UserSchema); //exportando o modelo