const mongoose = require('mongoose');//Pedindo funçoes do modulo mongoose
const Schema = mongoose.Schema;//Definiçao para abreviamento

//schema do coleçao que sera criado no mongodb
const seatSchema = new Schema({
    seats: [{
        num: Number,
        availability: String,
        user_id: { //id dos usuario associado ao assento
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        stats: {
            changeTime: Date,
            changeTo: String
        }
    }],
    change: Boolean,
    session_id: { //id da seçao associada aos assentos
        type: Schema.Types.ObjectId,
        ref: 'Movie_Session'
    },
});

/* seatSchema.post('findOneAndUpdate', async function (doc) {
    if(doc){
        console.log(doc);
        next()
    }
}) */

module.exports = mongoose.model('Seat', seatSchema); //exportando o modelo