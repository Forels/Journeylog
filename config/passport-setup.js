const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const User = require('../models/user-model');


require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {done(null, user)})
})

// Google strategy
passport.use(
    new GoogleStrategy({
        callbackURL: 'http://localhost:8080/auth/google/callback',
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    }, (accessToken, refreshToken, profile, done) => {
        // check if user already exist in our db
        //console.log(profile)
        User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                // already have the user
                //console.log('user is: ', currentUser)
                
                done(null, currentUser);
            } else {
                // if not, create user in our db
                new User({
                    username: profile.displayName,
                    googleId: profile.id,
                    thumbnail: profile._json.picture,
                    email: profile._json.email
                }).save().then((newUser) => {
                    console.log('new user created' + newUser);
                    done(null, newUser);
                });
            }
        });
        

        
    })
)
