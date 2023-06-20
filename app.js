if(process.env.NODE_ENV != "production") { //checa se o projeto nao esta em status produçao ou desenvolvimento
    require('dotenv').config(); //inicia o modulo dotenv que pega informaçoes sigilosas do arquivo .env
}


const express = require('express'); //pedindo framework express
const path = require('path'); //pedindo modulo "path"
const mongoose = require('mongoose'); //Pedindo funçoes do modulo mongoose
const ejsMate = require('ejs-mate'); //modulo ejs-mate
const session = require('express-session'); //modulo para guardar sessoes de browsers com express usando cookies
const flash = require('connect-flash'); //modulo flash para mostrar alertas fora do html normal da pagina
const ExpressError = require('./utils/ExpressError'); //funçao que extente a funçao Error para criar erros com mensagem e status dinamicos
const methodOverride = require('method-override'); //pedindo modulo method-override que permite mandar metodos "falsos" pelo form alem de somente post
const passport = require('passport');//modulo passport para autenticaçao e criptografia
const LocalStrategy = require('passport-local');//estrategia local passport para salvar credenciais
const User = require('./models/user'); //modelo mongoose
const mongoSanitize = require('express-mongo-sanitize'); //previne injeçoes de query strings maliciosos
const helmet =require('helmet'); //pacote de middlewares que mudam comportamento de headers para maior segurança

const userRoutes = require('./routes/users'); //pedindo rotas users
const movieRoutes = require('./routes/movies'); //pedindo rotas movies
const sessionRoutes = require('./routes/sessions'); //pedindo rotas sessions

const MongoStore = require('connect-mongo');

//conectando a base de dados com mongoose + lidando com possivel erros
//const dbUrl = 'mongodb://127.0.0.1:27017/moviedb';
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/moviedb';

mongoose.set('strictQuery', true);
mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express(); //abreviaçao para funçoes do express

app.engine('ejs', ejsMate); //define ejs-mate como o mecanismo para ler ejs oque permite a inserçao de layouts dinamicos
app.set('view engine', 'ejs'); //declarando ejs como view engine padrao
app.set('views', path.join(__dirname, 'views')); //declarando arquivo views como diretorio padrao de arquivos graficos

app.use(express.urlencoded({ extended: true })); //funçao middleware do express para se passar dados pelo req.body
app.use(methodOverride('_method')) //middleware da funçao do modulo method override com a query string _method para se iniciar no URL
app.use(express.static(path.join(__dirname, 'public'))) //servindo o diretorio public com arquivos estaticos
app.use(mongoSanitize());
app.use(helmet());
//abaixo configurando security policy do helmet como medida de segurança (url de serviços de terceiros que serao aceitos)
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net"
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dk8vi9fm1/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://m.media-amazon.com"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const secret = process.env.SECRET || 'naoésegredo!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: secret
    }
});
store.on("error", function(e){
    console.log("SESSION STORE ERROR", e)
})
const sessionConfig = { //configuraçoes das sessoes
    store,
    name: 'seção',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires : Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig)); //middleware que inicia uma sessao associando o cookie com informaçoes salvas 
app.use(flash()); //middleware que inicia o modulo com as funçoes de flash

app.use(passport.initialize());//inicia modulo passport de autenticaçao
app.use(passport.session());//permite passport interagir com sessao para login persistente
passport.use(new LocalStrategy(User.authenticate()));//declara a estrategia como local e declara o metodo de autenticaçao como um dos metodos do passport-local-mongoose

passport.serializeUser(User.serializeUser());//declara para passport como serializar o usuario, como sera guardado dados na sessao
passport.deserializeUser(User.deserializeUser());// '', como retirar dados do usuario da sessao

app.use((req, res, next) =>{ //middleware para criar a variaveis locais sucess e error para monstrar mensagem flash em qualquer pagina
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/movies', movieRoutes); //declarando /movies como prefixo padrao nas rotas de filme
app.use('/sessions', sessionRoutes); //declarando /sessions como prefixo padrao nas rotas de seçao
app.use('/', userRoutes); //da acesso as rotas referentes a crendenciais


app.get('/', (req, res) => {
    res.render('home')
})

app.all('*', (req, res, next) => { //rota catch-all para erro 404 caso nenhuma outra rota seja tomada
    next(new ExpressError('Page not found!', 404))
})

app.use((err, req, res, next) => { // rota generica para errors ( middleware 4 parametros)
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servindo porta ${port}`) //funçao listen para iniciar o servidor local na porta 3000 
})