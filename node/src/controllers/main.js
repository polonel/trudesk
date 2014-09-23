var async = require('async'),
    express = require('express'),
    passport = require('passport');

var mainController = {};

mainController.content = {};

mainController.index = function(req, res, next) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.layout = false;

    res.render('login', self.content);
};

mainController.dashboard = function(req, res, next) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.title = "Dashboard";
    self.content.nav = 'dashboard';

    var User = require('../models/user');

    var data = {};
    async.waterfall([
        function(callback){
            User.findOne({'username': req.user.username}, function(err, obj) {
                if (err) {
                    return res.send(err);
                }
                data.user = obj;
                callback(null, data);
            });
        }
    ], function(err, result) {
        data = result;
    });

    self.content.data = data;

    res.render('dashboard', self.content);
};

mainController.loginPost = passport.authenticate('local', {
                            successRedirect : '/dashboard',
                            failureRedirect : '/',
                            failureFlash : true
                        });
mainController.logout = function(req, res, next) {
    "use strict";
    req.logout();
    res.redirect('/');
};



module.exports = mainController;