var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Product=require('./product');
const mongoose = require("mongoose");
var Blacklist		     =  require( './countryBlacklist' );
var blacklistActions  =  require( './blacklistActions' );
var https=require('https')

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var requestIp            =  require( 'request-ip' );
app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('//signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('//signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
router.route('/blacklist')
    .post(authJwtController.isAuthenticated, function (req, res){
    var blacklist = new Blacklist();
    blacklist.countryName = req.body.countryName;
        blacklist.save(function (err) {
            if(err){
                res.json({message: "Error please try again\n", error: err});
            }
            else{
                res.json({message: "Items has successfully been saved"});
            }
        })
    });



router.route('/product')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var product = new Product();
        product.title = req.body.title;
        product.yearReleased = req.body.yearReleased;
        product.description=req.body.description;
        product.ImageURL= req.body.ImageURL;

        Product.findOne({title: req.body.title}, function(err, found){
            if(err){
                res.json({message: "Error please try again \n", error: err});
            }
            else if(found){
                res.json({message: "Duplicate,item already exists"});
            }

            else{
                product.save(function (err) {
                    if(err){
                        res.json({message: "Error please try again\n", error: err});
                    }
                    else{
                        res.json({message: "Items has successfully been saved"});
                    }
                })
            }
        });
    })

    .get(authJwtController.isAuthenticated,function (req,res){
        Product.find(function (err, movie) {
                res.json(movie);
            })
        }
    )

    .delete(authJwtController.isAuthenticated, function (req, res){
        Product.findOneAndDelete({title: req.body.title}, function (err, product) {
            if (err)
            {
                res.status(400).json({message: "Error something went wrong please try again", msg: err})
            }
            else if(product == null)
            {
                res.json({msg : "The item was not found please make sure the title is correct"})
            }
            else
                res.json({msg :"The item was successfully removed"})
        })
    })

    .put(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            var product = new Product();
            product.title = req.body.title;
            product.yearReleased = req.body.yearReleased;
            product.description =req.body.description;
            product.price=req.body.price;
            Product.findOneAndDelete({title: req.body.title}, function(err, found){
                if(err){
                    res.json({message: "Error please try again \n", error: err});
                }


                else if(!found){
                    res.json({message: "No item found with that title"});
                }

                else{
                    product.save(function (err) {
                        if(err){
                            res.json({message: "Error please try again\n", error: err});
                        }
                        else{
                            res.json({message: "item has successfully been updated"});
                        }
                    })
                }
            });
        })
router.route('/item/:itemTitle')

    .get(authJwtController.isAuthenticated,function (req,res){

            var reviewReq = req.query.reviews;

            var title = req.params.itemTitle
            Product.findOne({title: title}, function (err, movie) {
                if (err) {
                    res.send(err)
                }
                if (movie == null) {
                    res.json({msg: "ITEM NOT FOUND "+title})
                } else {

                        res.json(movie);
                    }
                })
    });


router.route( '/purchase' )
    .post(
        ( req , res ) =>
        {
            ip  =  requestIp.getClientIp( req );
            console.log(ip)
            https.get(
                'https://api.ipgeolocation.io/ipgeo?apiKey=' + process.env.API_KEY+ '&ip=' + ip,
                ( resp ) =>
                {
                    data  =  '';
                    resp.on( 'data', ( chunk ) => { data += chunk; } );
                    resp.on(
                        'end',
                        ( ) =>
                        {
                            jsonData         =  JSON.parse( data );
                            userCountryName  =  jsonData.country_name;
                                console.log(userCountryName)
                            blacklistActions.isBlacklisted( userCountryName )
                                .then(
                                    ( blacklist ) =>
                                    {
                                        if ( blacklist != null || blacklist  )
                                        {
                                            res.json({
                                                success   : false,
                                                message   : "Your Country "+userCountryName+" is blacklisted, we are sorry we cannot serve you."

                                            });
                                        }
                                        else
                                        {
                                            res.json({
                                                success   : true,
                                                message   : "Item successfully Purchased! Thank you for using A&A Bazaar!",

                                            });
                                        }
                                    })
                                .catch(
                                    ( ) =>
                                    {
                                        res.json({message   : "ERROR MAKING PURCHASE"});
                                    });
                        });
                })
                .on(
                    "error",
                    ( err ) =>
                    {

                        res.json({message   : err.message});
                    });

        })

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only
