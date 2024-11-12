const router = require('express').Router();
const passport = require('passport');


// auth login
router.get('/login', (req, res) => {
    res.render('login', {user:req.user});
    console.log("Visualizzazione della pagina login")
});

// auth logout
router.get('/logout', (req, res) => {
    // handle with passport
    req.logout(function(err) {
        if (err) {return next(err);}
        res.redirect('/');
        console.log("L'utente ha effettuato il logout, visualizzazione della pagina homepage")
    });
    
});

// auth with google
router.get('/google', passport.authenticate('google',{
    scope:['email','profile']
})
);

// callback route for google to redirect to
router.get('/google/callback', passport.authenticate('google'),(req, res) => {
    console.log(`L'utente ${req.user.id} ha effettuato l'accesso`);
    res.redirect(`/profile`)
})

module.exports = router;

