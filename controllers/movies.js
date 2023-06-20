const mongoose = require('mongoose');
const paginate = require('paginate')({mongoose: mongoose});
const Movie = require(`../models/movies`); //modelo mongoose

const { cloudinary } = require("../cloudinary");

module.exports.index = async(req, res) => { 
    const moviesfull = await Movie.find({}); //todos filmes
    const page = parseInt(req.query.page) || 1; //nº da pagina sendo carregada
    const limit = parseInt(req.query.limit) || 36;//nº de filmes para carregar na pagina
    let movies = moviesfull.slice(0, limit)//separa 36 filmes do array desde o inicio 0
    if(page>1){
        movies = moviesfull.slice(0+((page-1)*limit), (page*limit));//separa 36 filmes
    }
    const moviesLength = moviesfull.length
    let pagination = paginate.page(moviesfull.length, limit, page);
    let paginationHtml = pagination.render({ baseUrl: '/movies' });
    res.render('movies/index', { movies, moviesLength, page, paginationHtml  })
};

module.exports.newForm = async (req, res) => { //rota para pagina com formulario de novo filme
    const movies = await Movie.find({}, 'title _id');
    res.render('movies/new', { movies })
    
};

module.exports.newMovie = async (req, res) => { //rota de criaçao de um novo filme com validaçao JOI no req.body
    const movie = new Movie(req.body.movie);
    movie.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await movie.save();
    req.flash('success', 'Filme adicionado com sucesso!');
    res.redirect(`/movies/${movie._id}`);
};

module.exports.showMovie = async (req, res) => { //rota para pagina show de um filme
    const movie = await Movie.findById(req.params.id);
    if(!movie){
        req.flash('error', 'Não encontrado.');
        return res.redirect('/movies');
    }
    res.render('movies/show', { movie });
};

module.exports.updateForm = async (req, res) => { //rota para pagina com formulario para atualizar dados de um filme
    const movie = await Movie.findById(req.params.id);
    if(!movie){
        req.flash('error', 'Não encontrado.');
        return res.redirect('/movies');
    }
    res.render('movies/edit', { movie });
};

module.exports.updateMovie = async (req, res) => { //rota para atualizar um filme com validaçao JOI
    const { id } = req.params;
    const movie = await Movie.findByIdAndUpdate(id, { ...req.body.movie });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    movie.images.push(...imgs);
    await movie.save();
    if (req.body.deleteImages) {
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await movie.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
    }
    req.flash('success', 'Filme atualizado com sucesso!');
    res.redirect(`/movies/${movie._id}`);
}

module.exports.deleteMovie = async (req, res) => { //rota para deletar um filme (aciona middleware do modelo mongoose)
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    req.flash('success', 'Filme removido com sucesso!');
    res.redirect('/movies');
};