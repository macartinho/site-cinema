const mongoose = require('mongoose'); //Pedindo funçoes do modulo mongoose
const Schema = mongoose.Schema; //Definiçao para abreviamento
const Session = require('./session');//modelo das seçoes


const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

//schema do coleçao que sera criado no mongodb
const MovieSchema = new Schema({ 
    title: String,
    releaseDate: Date,
    description: String,
    images: [ImageSchema],
    genre: String,
    runtime: Number,
    director: String,
    writer: String,
    actors: String,
    sessions_id: [{ //id das seçoes associados ao filme
        type: Schema.Types.ObjectId,
        ref: 'Movie_Session'
    }]
});

MovieSchema.post('findOneAndDelete', async function (doc) { //middleware que deleta seçoes associadas ao filme quando o filme for deletado
    if(doc){
         for(let id of doc.sessions_id){ 
            await Session.findOneAndDelete({_id: id})
         }
    }
})

module.exports = mongoose.model('Movie', MovieSchema); //exportando esse modelo mongosse para outros arquivos