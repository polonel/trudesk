/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

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
        User.findOne({'username' : new RegExp("^" + username + "$", 'i')}, function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, req.flash('loginMessage', 'No User Found.'));
            }

            if (!User.validate(password, user.password)) {
                return done(null, false, req.flash('loginMessage', 'Incorrect Password.'));
            }

            req.user = user;

            return done(null, user);
        });
    }));

    return passport;
};