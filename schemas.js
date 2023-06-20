const BaseJoi = require('joi'); //joi nao extendido
const sanitizeHtml = require('sanitize-html'); //pacote que remove tags HTML
const extension = (joi) => ({ //extensao para Joi
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension) //modulo joi para validaçao de dados extendido com validaçao para remover tags HTML
Joi.objectId = require('joi-objectid')(Joi);//tipo ID para validaçao joi

module.exports.movieSchema = Joi.object({
    movie: Joi.object({
        title: Joi.string().required().escapeHTML(),
        releaseDate: Joi.date().required(),
        description: Joi.string().required().escapeHTML(),
        //img: Joi.string().required(),
        genre: Joi.string().required().escapeHTML(),
        runtime: Joi.number().max(900).min(1).required(),
        director: Joi.string().required().escapeHTML(),
        writer: Joi.string().required().escapeHTML(),
        actors: Joi.string().required().escapeHTML(),
        sessions_id: Joi.objectId()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.sessionSchema = Joi.object({
    session: Joi.object({
        airtime: Joi.date().required(),
        endtime: Joi.date().required(),
        location: Joi.object({
            street: Joi.string().escapeHTML(),
            number: Joi.number(),
            state: Joi.string().escapeHTML(),
            city: Joi.string().escapeHTML(),
            cep: Joi.number()
        }),
        seatNum: Joi.number().max(50).min(1).required(),
        movie_id: Joi.objectId().required(),
        seats_id: Joi.objectId()
    }).required()
});