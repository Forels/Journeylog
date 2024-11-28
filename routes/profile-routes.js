const route = require('./auth-routes');
const World = require('../models/world-model')
const Trip = require('../models/trip-model');
const User = require('../models/user-model');
const mongoose = require('mongoose');
const { response, query } = require('express');

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

// Funzione per ottenere tutti gli stati del mondo
function getCountryPromise(req, res, next){
    var promise = World.find().exec()
    return promise
}

// Funzione per ottenere i viaggi di determinati utenti
function getTrip(req, res, next, input){

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
          {$lookup: {
            from:'users',
            localField:'googleId',
            foreignField:'googleId',
            as: 'reseltato'
          }},
          {
            $match: {
              userId: {$in: input}
            }
          }
        ]
      );
    return promise
}

// Funzione per ottenere l'elenco di tutti gli utenti registrati tranne gli amici
function getUserPromise(req, res, next, input){
    var promise = User.find({_id:{$nin:input}}).exec();
    return promise
}

// Funzione per ottenere il conteggio dei follower
async function getFollowerPromiseCount(req){
    var promise = await User.find({friends:req}).count().exec();
    return promise
}

// /profile/user

// Funzione per ottenere i viaggi di determinati utenti
function getUserTrip(req, res, next, input){

    console.log("utente richiedente: ", req.query.id)

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

// Funzioni per ottenere info sugli utenti
function getUserInfoPromise(req, res, next, input){
    var promise =  User.find({_id:input}).exec();
    return promise
}


function renderProfile(req, res, next, userNotFriendsArray, usersTripArray, countryArray, userTripInfo, numbfollow){
    //console.log(`l'utente che si è connesso è: ${req.user}`)
    res.render('profile', { user: req.user, userNotFriendsArray, usersTripArray, countryArray, userTripInfo ,numbfollow});
}


router.get('/', function(req, res, next){
    res.render('home', {user:req.user})
    
    if(!req.user){
        // Se l'utente non è loggato allora visualizza la pagina home
        res.render('home',{user:req.user})
    } else {
        // Se l'utente è loggato lo reinderizza al suo profilo
        res.redirect('/profile')
        //res.render('home',{user:req.user})
    }
    
})


router.get(`/profile`, 
    
    function(req, res, next){
        // Se l'utente non è loggato lo reinderizza sull'homepage
        if(!req.user){ return res.redirect('/');}
        // Se l'utente è loggato prosegue
        next();
    }, function(req, res, next){ 
        
        // Array contenente tutti gli utenti {users:[{username, thumbnail, id}]} tranne gli amici
        var userNotFriendsArray = {"users":[]}
        // Array contenente i viaggi effettuati dall'utente più amici {trips:[{userId, googleId, countryName, tripStart, tripEnd}]}
        var usersTripArray = {"trips":[]}
        // Array che contiene i paesi del mondo {countries:[{Country, Abbreviation, Capital, CurrencyCode, OfficialLanguage}]}
        var countryArray = {"countries":[]}
        //Array viaggi utente visualizzato
        var userTripInfo = {"trips":[]}


        var numbfollow;

        var friendsArray = []
        friendsArray.push(req.user._id)

        for(let i in req.user.friends){
            friendsArray.push(req.user.friends[i])
        }

        console.log("Utente loggato: ", req.user._id)

               // la funzione permette di ottenere l'elenco di tutti gli stati del mondo. Serve per compilare il form di registrazione viaggi
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

            // Funzione per ottenere viaggi degli amici più utente stesso
            var userTripPromise = getTrip(req, res, next, friendsArray)
            userTripPromise.then(function(tripsUsers){
                tripsUsers.forEach(function(tripUser){
                    usersTripArray['trips'].push({
                        'countryName':tripUser.countryName,
                        'googleID':tripUser.googleId,
                        'userId':tripUser.userId,
                        'tripStart':tripUser.tripStart,
                        'tripEnd': tripUser.tripEnd,
                        'Abbreviation':tripUser.result[0].Abbreviation,
                        'Capital':tripUser.result[0].Capital,
                        'CurrencyCode':tripUser.result[0].CurrencyCode,
                        'OfficialLanguage':tripUser.result[0].OfficialLanguage,
                        'username':tripUser.reseltato[0].username,
                        'thumbnail': tripUser.reseltato[0].thumbnail
                    })
                })
                
                // Funzione per ottenere tutti gli utenti registrati tranne gli amici più utente stesso 
                var userPromise = getUserPromise(req, res, next, friendsArray)
                userPromise.then(function(users){
                    users.forEach(function(user){
                        userNotFriendsArray['users'].push({
                            'username':user.username, 
                            'thumbnail':user.thumbnail, 
                            'id':user._id,
                            'friends':user._doc.friends
                        })
                    })


                    var trip = getUserTrip(req, res, next, req.query.id)
                    trip.then(function(trips){
                        trips.forEach(function(trip){
                            userTripInfo['trips'].push({
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
                    
                        // Funzione per ottenere il numero di follower dell'utente registrato 
                        var followerPromise = getFollowerPromiseCount(req.user.id)
                        followerPromise.then(function(followers){
                        
                            numbfollow = followers;

                            
                            renderProfile(req, res, next, userNotFriendsArray, usersTripArray, countryArray, userTripInfo, numbfollow);
                        }) //chiusura followerCount
                    }) // chisura funzione getUserTrip
                }) // chiusura funzione userPromise 
            }) // chiusura funzione viaggi utente         
        })  // chiusura funzione countryPromise    
        
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
                    'id':req.query.id,
                    'friends':userInfo._doc.friends
                })    
            })

            var trip = getUserTrip(req, res, next, req.query.id)
            trip.then(function(trips){
                trips.forEach(function(trip){
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
                        
                var followerPromise = getFollowerPromiseCount(req.query.id)
                var numbfollow;
                followerPromise.then(function(followers){
                       
                    numbfollow = followers;
                    console.log("seguaci: ", numbfollow)

                    res.render('user', {user: req.user, userInfoArray, userTripArray, numbfollow});
                }) // chiusura getFollowerPromiseCount
            }) // chiusura getUserTrip            
        }) // chiusura getUserInfoPromise

});

router.post('/profile/user', function(req, res, next){

    
   User.updateOne(
        {_id:req.body.idpersonale}, 
        {$push: {'friends':`${req.body.idvisualizzato}`}}).then(console.log("fatto"))


    //console.log("id personale: ", req.body.idpersonale)
    //console.log("id visual: ", req.body.idvisualizzato)

    res.redirect(`/profile/user?id=${req.body.idvisualizzato}`);

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
