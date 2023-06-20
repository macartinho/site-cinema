const mongoose = require('mongoose');//Pedindo funçoes do modulo mongoose
const Schema = mongoose.Schema;//Definiçao para abreviamento
/* const Seat = require('./seats');//modelo seats
const Movie = require('./movies');//modelo movie */

//schema do coleçao que sera criado no mongodb
const sessionSchema = new Schema({ 
    airtime: Date,
    endtime: Date,
    seatNum: Number,
    location: {
        street: String,
        number: Number,
        state: String,
        city: String,
        cep: Number,
        geometry: {
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
    }},
    seat: {
        seat: [{
            num: Number,
            availability: String,
            user_id: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            stats: [{
                changeTime: Date,
                changeTo: String,
                _id: false
            }]
        }],
        change: Boolean
    },
    movie_id: { //filme associado
        type: Schema.Types.ObjectId,
        ref: 'Movie'
    },
/*     seats_id: { //assentos associados
        type: Schema.Types.ObjectId,
        ref: 'Seat'
    } */
});

/* sessionSchema.post('findOneAndDelete', async function (doc) { //middleware que deleta os assentos associados quando a seçao é deletada
    if(doc){
        await Seat.findOneAndDelete({_id: doc.seats_id})
   }
}) */

module.exports = mongoose.model('Movie_Session', sessionSchema); //exportando o modelo