const Seat = require(`../models/seats`); //modelo mongoose
const Movie = require(`../models/movies`); //modelo mongoose
const Session = require(`../models/session`); //modelo mongoose
const User = require(`../models/user`); //modelo mongoose
const mongoose = require('mongoose');//funçoes mongoose para a paginaçao
const paginate = require('paginate')({ mongoose: mongoose });//pede o puglin de paginaçao e declara mongoose como o metodo para receber informaçoes da DB
const municipios = require('../estados-cidades');//objeto com municipios e respectivas cidades para preencher o formulario
const mapBoxToken = process.env.MAPBOX_TOKEN;//token de acesso a API mapbox
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { boolean } = require('joi');
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });//pedindo serviço geocoding da API para criar lat e long de uma string

module.exports.index = async (req, res) => { //rota para pagina de index de seçoes
    const sessionsfull = await Session.find({}).populate('movie_id');
    sessionsfull.sort((a, b) => a.airtime.getTime() - b.airtime.getTime());
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    let sessions = sessionsfull.slice(0, limit)
    if (page > 1) {
        sessions = sessionsfull.slice(0 + ((page - 1) * limit), (page * limit));
    }
    let pagination = paginate.page(sessionsfull.length, limit, page);
    let paginationHtml = pagination.render({ baseUrl: '/sessions' });
    res.render('sessions/index', { sessions, paginationHtml })

};

module.exports.newForm = async (req, res) => { //rota para pagina com formulario para criar nova seçao
    const movies = await Movie.find({}, 'title _id runtime releaseDate');
    res.locals.movies = movies;
    res.render('sessions/new', { movies, municipios })
};

module.exports.newSession = async (req, res) => { //rota para criar nova seçao e suas relaçoes com validaçao JOI
    const session = new Session(req.body.session);
    const geoData = await geocoder.forwardGeocode({
        query: (session.location.street + ", " + session.location.number + " - " + session.location.city + " - " + session.location.state + ", " + session.location.cep),
        limit: 1,
        proximity: 'ip'
    }).send()
    session.location.geometry = geoData.body.features[0].geometry
    let data = new Date()

    for (let i = 0; req.body.session.seatNum > i; i++) {
        session.seat.seat.push({ availability: 'free', num: i + 1, stats: [{ changeTime: data, changeTo: 'free' }] });
        session.seat.change = false;
    }
    const movie = await Movie.findById(req.body.session.movie_id);
    movie.sessions_id.push(session);
    await movie.save();
    await session.save();
    req.flash('success', 'Sessão criada com sucesso!');
    res.redirect(`/sessions/${session._id}`);
};

module.exports.showSession = async (req, res) => { //rota para pagina show de uma seçao
    const session = await Session.findById(req.params.id).populate('movie_id');
    if (!session) {
        req.flash('error', 'Não encontrado.');
        return res.redirect('/sessions');
    }
    res.render('sessions/show', { session })
};

module.exports.updateForm = async (req, res) => { //rota para pagina de ediçao de uma seçao
    const session = await Session.findById(req.params.id);
    if (!session) {
        req.flash('error', 'Não encontrado.');
        return res.redirect(`/sessions`);
    }
    session.selectedState = (municipios.municipios.find(o => o.nome === session.location.state)).sigla;
    session.selectedCities = (municipios.municipios.find(o => o.nome === session.location.state)).cidades;
    res.render('sessions/edit', { session, municipios })
};

module.exports.updateSession = async (req, res) => { // rota para atualizar uma seçao com validaçao JOI
    const { id } = req.params;
    const sessionold = await Session.findByIdAndUpdate(id, { ...req.body.session });
    const sessionnew = await Session.findById(id);
    if (sessionnew.location.cep !== sessionold.location.cep || sessionnew.location.street !== sessionold.location.street || sessionnew.location.number !== sessionold.location.number) {
        const geoData = await geocoder.forwardGeocode({
            query: (session.location.street + ", " + session.location.number + " - " + session.location.city + " - " + session.location.state + ", " + session.location.cep),
            limit: 1,
            proximity: 'ip'
        }).send()
        sessionnew.location.geometry = geoData.body.features[0].geometry
    } else {
        sessionnew.location.geometry = sessionold.location.geometry
    }
    if (!(sessionold.seatNum === sessionnew.seatNum)) {
        if (sessionold.seatNum > sessionnew.seatNum) {
            for (let i = 0; sessionold.seatNum - sessionnew.seatNum > i; i++) {
                let lastIndex = sessionnew.seat.seat.length - 1;
                if (sessionnew.seat.seat[lastIndex].user_id) {
                    const user = await User.findById(sessionnew.seat.seat[lastIndex].user_id);
                    user.rentedChair.splice(user.rentedChair.indexOf(sessionnew.seat.seat[lastIndex]._id), 1);
                    await user.save();
                }
                sessionnew.seat.seat.pop();
            }
        } else {
            let data = new Date()
            for (let i = 0; sessionnew.seatNum - sessionold.seatNum > i; i++) {
                newseat = { num: sessionnew.seat.seat.length + 1, availability: 'free', stats: [] }
                newseat.stats.push({ changeTime: data, changeTo: 'free' });
                sessionnew.seat.seat.push(newseat)
            }
        }
    }
    await sessionnew.save();
    req.flash('success', 'Sessão atualizada com sucesso!');
    res.redirect(`/sessions/${sessionnew._id}`);
};

module.exports.seats = async (req, res) => { //rota para pagina dos assentos
    const seat = await Session.findOne({ _id: req.params.id }, 'seat seatNum');
    res.render('sessions/seat', { seat });
};

module.exports.deleteSession = async (req, res) => { //rota para deletar uma seçao
    const { id } = req.params;
    const session = await Session.findByIdAndDelete(id);
    for (let i = 0; i < session.seat.seat.length; i++) {
        if (session.seat.seat[i].user_id) {
            const user = await User.findById(session.seat.seat[i].user_id);
            user.rentedChair.splice(user.rentedChair.indexOf(session.seat.seat[i]._id), 1);
            await user.save();
        }
    }
    await Movie.findOneAndUpdate({ _id: session.movie_id }, { $pullAll: { 'sessions_id': [id] } }, { new: true });
    req.flash('success', 'Sessão removida com sucesso!');
    res.redirect('/sessions');
};

module.exports.updateSeat = async (req, res) => { //rota para alugar um assento
    const { seat_num, session_id } = req.body;
    const sessionSeat = await Session.findById(session_id);
    const user = await User.findById(req.user._id)
    const seatIndex = sessionSeat.seat.seat.findIndex(x => x.num == seat_num);
    let data = new Date();
    if (sessionSeat.seat.seat[seatIndex].availability !== 'free') {
        if (sessionSeat.seat.seat[seatIndex].availability == 'rented') {
            if (sessionSeat.seat.seat[seatIndex].user_id.toString() == req.user._id.toString()) {
                sessionSeat.seat.seat[seatIndex].availability = "free";
                sessionSeat.seat.seat[seatIndex].user_id = undefined;
                sessionSeat.seat.seat[seatIndex].stats.push({ changeTime: data, changeTo: 'free' });
                sessionSeat.seat.change = true;
                console.log(sessionSeat.seat.seat[seatIndex].stats)
                user.rentedChair.splice(user.rentedChair.indexOf(sessionSeat.seat.seat[seatIndex]._id), 1);
                await sessionSeat.save();
                await user.save();
                req.flash('success', 'Assento Livre!');
                return res.send();
            }
        }
        req.flash('error', 'Assento Não Dísponivel');
        throw new Error('Assento Não Dísponivel');
    }
    sessionSeat.seat.seat[seatIndex].availability = "rented";
    sessionSeat.seat.seat[seatIndex].user_id = req.user._id;
    sessionSeat.seat.seat[seatIndex].stats.push({ changeTime: data, changeTo: 'rented' });
    sessionSeat.seat.change = true;
    user.rentedChair.push(sessionSeat.seat.seat[seatIndex]._id)
    await sessionSeat.save();
    await user.save();
    req.flash('success', 'Assento alugado!');

    /* res.render(`sessions/seat`, { seat }); */
    res.send();
};

module.exports.checkChange = async (req, res) => { //rota para cheCar se ouve mudanças na disponibilidade dos assentos
    const { session, seat_status } = req.body;
    const seat = await Session.findOne({ _id: session }, 'seatNum seat');
    const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]); /* COMPARA CADA ELEMENTO DOS ARRAYS */
    if (!(equals(seat.seat.seat.map(x => x.availability), seat_status.split(',')))) {
        seat.seat.seat.change = false;
        await seat.save();
        return res.send(true);
    }
    res.send(false)
};

module.exports.seatData = async (req, res) => { //rota para ocupar/desocupar um assento baseado nos dados do sensor
    const { sensorData, chairNum, key, id } = req.body;
    if (!(key === "Vg_gZr8cQ5$nK#kbUq56e|l(l7?AV0<8!9")) {
        req.flash('error', 'Não autorizado.');
        return res.send(false);
    };
    console.log(sensorData)
    const session = await Session.findById(id);
    let change = false;
    let objStat = {};
    const data = new Date();
    if (sensorData > 25000) {

        session.seat.seat.map(obj => {
            if (obj.num == chairNum) {
                if (obj.availability !== "occupied") {
                    obj.availability = 'occupied';
                    objStat = { changeTime: data, changeTo: 'occupied' };
                    change = true;
                }
            }
            return obj;
        })
    } else {
        session.seat.seat.map(obj => {
            if (obj.num == chairNum) {
                if (obj.availability == "occupied") {
                    if (obj.user_id) {
                        obj.availability = 'rented';
                        objStat = { changeTime: data, changeTo: 'rented' }
                    } else {
                        obj.availability = 'free';
                        objStat = { changeTime: data, changeTo: 'free' }
                    }
                    change = true;
                }
            }
            return obj;
        })
    }
    if (change === true) {
        session.seat.seat.change = true;
        session.seat.seat[chairNum - 1].stats.push(objStat);
        await session.save();
    }
    res.send('received');
};

module.exports.showRoom = async (req, res) => { //rota para pagina show de uma sala
    const session = await Session.findById(req.params.id);
    if (!session) {
        req.flash('error', 'Não encontrado.');
        return res.redirect('/rooms');
    }
    res.render('sessions/showChairs', { session });
};

module.exports.sessionDetails = async (req, res) => { //rota para liberar uma caderia
    const { id } = req.params;;
    const session = await Session.findById(id);
    res.render('sessions/sessionDetails', { session });
};

module.exports.addSeat = async (req, res) => { //rota para adicionar assento
    const { id } = req.params;
    const session = await Session.findById(id);

    session.seatNum++
    const newSeat = {
        num: session.seatNum,
        availability: "free",
        stats: []
    }
    let data = new Date();
    newSeat.stats.push({ changeTime: data, changeTo: 'free' })
    session.seat.seat.push(newSeat)
    await session.save();


    req.flash('success', 'Cadeira adicionada com sucesso!');
    res.redirect(`/sessions/${session._id}/session`);
};

module.exports.deleteSeat = async (req, res) => { //rota para atualizar um filme com validaçao JOI
    const { id } = req.params;
    const session = await Session.findById(id);
    for (let seat of session.seat.seat) {
        if (seat.num == req.body.seat.num) {
            if (seat.availability == "rented") {
                const user = await User.findById(seat.user_id);
                const index = user.rentedChair.indexOf({ num: req.body.seat.num, session_id: id })
                user.rentedChair.splice(index, 1);
                await user.save()
            }
        }
    }
    const seatIndex = session.seat.seat.findIndex(x => x.num == req.body.seat.num);
    session.seat.seat.splice(seatIndex, 1)
    session.seatNum--
    await session.save();
    req.flash('success', 'Cadeira removida com sucesso!');
    res.redirect(`/sessions/${session._id}/session`);
}

module.exports.deleteRentedUser = async (req, res) => { //rota para liberar uma caderia
    const { id } = req.params;
    const user = await User.findById(req.body.user._id);
    const session = await Session.findById(id);
    let data = new Date();
    const seatIndex = session.seat.seat.findIndex(x => x.num == req.body.user.numSeat);
    session.seat.seat[seatIndex].availability = "free";
    session.seat.seat[seatIndex].user_id = undefined;
    session.seat.seat[seatIndex].stats.push({ changeTime: data, changeTo: 'free' });
    user.rentedChair.splice(user.rentedChair.indexOf(session.seat.seat[seatIndex]._id), 1);
    await session.save();
    await user.save();
    req.flash('success', 'Assento livre com sucesso!');
    res.redirect(`/sessions/${session._id}/seatDetails`);
};