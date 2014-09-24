var passport = require('passport');
var Local = require('passport-local').Strategy;
var User = require('../models/user');

module.exports = function(app) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local', new Local({
        usernameField : 'login-username',
        passwordField : 'login-password',
        passReqToCallback : true
    }, function(req, username, password, done) {
        User.findOne({'username' : username}, function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                console.log('No User Found');
                return done(null, false, req.flash('loginMessage', 'No User Found.'));
            }

            if (!user.validate(password)) {
                console.log('invalid pass');
                return done(null, false, req.flash('loginMessage', 'Incorrect Password.'));
            }

            console.log('Worked');
            req.user = username;

            console.log(req.user);
            return done(null, user);
        });
    }));

    return passport;
};