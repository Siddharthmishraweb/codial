const express = require('express');
const env = require('./config/environment');
// const logger = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
require('./config/view-helpers')(app);
const port = 8000;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');
// used for session cookie
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');
const passportJWT = require('./config/passport-jwt-strategy');
const passportGoogle = require('./config/passport-google-oauth2-strategy');
const path = require('path');

const MongoStore = require('connect-mongo')(session);
const scssMiddleware = require('sass-middleware');
const flash = require('connect-flash');
const customMware = require('./config/middleware');

// setup the chat server to be used with socket.io
const chatServer = require('http').Server(app);
const chatSockets = require('./config/chat_sockets').chatSockets(chatServer);
chatServer.listen(5000);
console.log(`Chat server is running on port: 5000`);




app.use(scssMiddleware({
    src: './assets/scss',
    dest: './assets/css',
    debug: true,
    outputStyle: 'extended',
    prefix:'/css'
 }))


app.use(express.urlencoded({extended: false}));

app.use(cookieParser());

app.use(express.static('./assets'));
// make the uploads path avaiable to the browser
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/.well-known/pki-validation', express.static(__dirname + '/pki-validation'));

// app.use(logger(env.morgan.mode, env.morgan.options));

app.use(expressLayouts);
// extract style and scripts from subpages into the layout 
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);


// set up the view engine
app.set('view engine', 'ejs');
app.set('views', './views');
const sessionStore = new MongoStore({
    mongooseConnection: db,
    autoRemove: 'disabled'
  }, function(err) {
    console.log(err || 'connect-mongo setUp ok')
  });
// mongo store is used to store the session cookie in db
app.use(session({
    name:'codial',
    // TODO :change the secret before deployement in produxtion mode
    secret:'blahsomething',
    saveUninitialized: false,
    resave: false,
    cookie: {
       maxAge: (1000 * 60 * 100)
    },
    store: sessionStore
 }))

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

app.use(flash());
app.use(customMware.setFlash);

//use express router
app.use('/', require('./routes'));

app.listen(port, function(err)
{
    if(err)
    {
        console.log(`Error in running the server: ${err}`);
    }
    console.log(`Server is running on port: ${port}`);
});