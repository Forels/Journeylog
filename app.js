const express = require('express');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');

require('dotenv').config();


const app = express();

app.use(express.static(__dirname+'/views'));

app.set('view engine', 'ejs');

app.use(cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_KEY],
    maxAge: 24 * 60 * 60 * 1000,
}));

// register regenerate & save after the cookieSession middleware initialization
app.use(function(request, response, next) {
    if (request.session && !request.session.regenerate) {
        request.session.regenerate = (cb) => {
            cb()
        }
    }
    if (request.session && !request.session.save) {
        request.session.save = (cb) => {
            cb()
        }
    }
    next()
})

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

//app.use(express.json());
app.use(express.json())
app.use(express.urlencoded({extended: true}));

// connect to mongodb
mongoose.connect(process.env.DB_URI)

// setup with routes
app.use('/auth', authRoutes);
app.use('/',profileRoutes);

app.get('/explore', (req, res) => { 
    res.render('explore',{user:req.user})
});

module.exports = app;

app.listen(8080, () => {
    console.log('app now listening for request on port 3000')
});