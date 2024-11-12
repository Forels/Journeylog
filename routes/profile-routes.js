const route = require('./auth-routes');
const World = require('../models/world-model')
const Trip = require('../models/trip-model');
const User = require('../models/user-model');
const mongoose = require('mongoose');

const router = require('express').Router();


const authCheck = (req, res, next) => {
    if(!req.user){
        // if user is not logged in
        res.render('home');
        console.log("devi autenticarti")
    } else {
        // user is logged in
        console.log("Sei già autenticato")
        res.render('profile', {user:req.user})
    }
};

// Funzione per ottenere i viaggi di un dato utente 
function getTripPromise(req, res ,next, input){
    var promise = Trip.find({userId: input}).exec();
    return promise
}

function getProva(req, res, next, input){
    var promise = Trip.aggregate(
        [
          {
            $lookup: {
              from: 'worlds',
              localField: 'countryName',
              foreignField: 'Country',
              as: 'result'
            }
          },
          {
            $match: {
              userId: input
            }
          }
        ]
      );
    return promise
}

// Funzione per ottenere l'elenco di tutti gli utenti registrati
function getUserPromise(req, res, next){
    var promise = User.find({googleId:{$nin:[req.user.googleId]}}).exec();
    return promise
}

function getUserInfoPromise(req, res, next,input){
    var promise = User.find({_id:input}).exec();
    return promise
}

// Funzione per ottenere tutti gli stati del mondo
function getCountryPromise(req, res, next){
    var promise = World.find().exec()
    return promise
}

function renderProfile(req, res, next, userArray, userTripArray, countryArray){
    //console.log(`l'utente che si è connesso è: ${req.user}`)
    res.render('profile', { user: req.user, userArray, userTripArray, countryArray});
}


router.get('/', function(req, res, next){
    res.render('home', {user:req.user})
    /*
    if(!req.user){
        // Se l'utente non è loggato allora visualizza la pagina home
        res.render('home',{user:req.user})
    } else {
        // Se l'utente è loggato lo reinderizza al suo profilo
        res.redirect('/profile')
        //res.render('home',{user:req.user})
    }
    */
})


router.get(`/profile`, 
    
    function(req, res, next){
        // Se l'utente non è loggato lo reinderizza sull'homepage
        if(!req.user){ return res.redirect('/');}
        // Se l'utente è loggato prosegue
        next();
    }, function(req, res, next){ 
        
        // Array contenente tutti gli utenti {users:[{username, thumbnail, id}]}
        var userArray = {"users":[]}
        // Array contenente i viaggi effettuati dall'utente che si sta visualizzando {trips:[{userId, googleId, countryName, tripStart, tripEnd}]}
        var userTripArray = {"trips":[]}
        // Array che contiene i paesi del mondo {countries:[{Country, Abbreviation, Capital, CurrencyCode, OfficialLanguage}]}
        var countryArray = {"countries":[]}


        var userPromise = getUserPromise(req, res, next, userArray)
        userPromise.then(function(users){
            users.forEach(function(user){
                userArray['users'].push({
                    'username':user.username, 
                    'thumbnail':user.thumbnail, 
                    'id':user._id})
            })

            var data = req.user._id.toString()
            //console.log(data)

            var userTripPromise = getProva(req, res, next, req.user._id.toString())
            userTripPromise.then(function(tripsUsers){
                tripsUsers.forEach(function(tripUser){
                    userTripArray['trips'].push({
                        'countryName':tripUser.countryName,
                        'googleID':tripUser.googleId,
                        'userId':tripUser.userId,
                        'tripStart':tripUser.tripStart,
                        'tripEnd': tripUser.tripEnd,
                        'Abbreviation':tripUser.result[0].Abbreviation,
                        'Capital':tripUser.result[0].Capital,
                        'CurrencyCode':tripUser.result[0].CurrencyCode,
                        'OfficialLanguage':tripUser.result[0].OfficialLanguage
                    })
                })
                
                var countryPromise = getCountryPromise(req, res, next)
                countryPromise.then(function(countries){
                    countries.forEach(function(country){
                        countryArray['countries'].push({
                            'Country':country.Country, 
                            'Abbreviation':country.Abbreviation, 
                            'Capital':country.Abbreviation, 
                            'CurrencyCode':country.CurrencyCode, 
                            'OfficialLanguage':country.OfficialLanguage
                        })
                    })
 
                    renderProfile(req, res, next, userArray, userTripArray, countryArray);
                })

            })
            
        })
        
})

router.get('/profile/user', function(req, res, next){

    // Array contenente info user {info:[{username, thumbnail, id}]}
    var userInfoArray = {"info":[]}
    // Array contenente i viaggi effettuati dall'utente che si sta visualizzando 
    var userTripArray = {"trips":[]}


        var UserInfoPromise = getUserInfoPromise(req, res, next, req.query.id)
        UserInfoPromise.then(function(userInfos){
            userInfos.forEach(function(userInfo){
                userInfoArray['info'].push({
                    'username':userInfo.username, 
                    'thumbnail':userInfo.thumbnail, 
                    'id':req.query.id
                })
            })
            const user_id = req.query.id;

            var trip = getProva(req, res, next, req.query.id)
                    trip.then(function(trips){
                        trips.forEach(function(trip){
                            //console.log(prova)
                            userTripArray['trips'].push({
                                'countryName':trip.countryName,
                                'googleID':trip.googleId,
                                'userId':trip.userId,
                                'tripStart':trip.tripStart,
                                'tripEnd': trip.tripEnd,
                                'Abbreviation':trip.result[0].Abbreviation,
                                'Capital':trip.result[0].Capital,
                                'CurrencyCode':trip.result[0].CurrencyCode,
                                'OfficialLanguage':trip.result[0].OfficialLanguage,
                             })
                        })
                        
                        res.render('user', {user: req.user, userInfoArray, userTripArray});
                    })            
        })
});




router.post('/profile', function(req, res, next){
   
    if(req.body.country!==''){
        // Controllo se il paese sia già nel db
        Trip.findOne({countryName:req.body.country, googleId: req.user.googleId}).then((currentCountry) => {
            if(currentCountry){
                // Il paese è già nel db
                console.log('Il viaggio è già nel db: ', currentCountry)
            } else {
                // Il paese non è nel db, lo aggiungo
               
                //console.log("differenza ",differenceInDays)
                //console.log(req.user) 
                new Trip({
                    countryName: req.body.datalistopt,
                    googleId: req.user.googleId,
                    userId: req.user.id,
                    tripStart: req.body.tripstart,
                    tripEnd: req.body.tripend,
                }).save().then((newTrip)=>{
                    console.log("Nuovo viaggio aggiunto", newTrip);
                })
            }
            
        })
        return res.redirect('/')

    }else{
        console.log("errore");
    }
});

module.exports = router;
