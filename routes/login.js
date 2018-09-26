const express = require('express');
const router = express.Router();
const url = require('url');
const passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

router.get('/', ensureAuthenticated, function(req, res){
    //res.render('index');
    res.send('authenticated');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
        // res.redirect('/users/login');
        //res.send('register yourself');
        res.render('home' , {title : 'MovieDB', user : null})
	}
}

router.get('/login' , (req, res) =>{
    let msg = req.query ? (req.query.reg_success ? req.query.reg_success : null ) : null;
    res.render('login' , { title : 'MovieDB' , info  : req.flash('info')});
})

passport.use(new LocalStrategy(
	function (email, password, done) {
		User.getUserByEmail(email, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
    passport.authenticate('local', {  failureRedirect: '/login', failureFlash: true }),
    function (req, res) {
    res.redirect('/browse');
}); 



router.get('/register' , (req, res) =>{
    res.render('register' , { title : 'MovieDB'});
})

router.post('/register' , (req, res) =>{
    //res.render('register' , { title : 'MovieDB'});
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;

    req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
    }
    else{
        //res.send

        User.findOne({ email: { 
                "$regex": "^" + email + "\\b", "$options": "i"
        }}, function (err, mail) {
           
            if (mail) {
                res.render('register', {
                    mail: mail,
                    title : 'MovieDB'
                    
                });
            }
            else{
                let new_user = new User({
                    email: email,
                    username: username,
                    password: password
                });
                
                User.registerUser(new_user, function (err, user) {
                    if (err) throw err;
                    req.flash('info' ,'Succesfully registered! Sign In to continue.');
                    res.redirect('/login');
                });
                
            }

        })
    }
})

module.exports = router;

