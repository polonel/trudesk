var async = require('async'),
    passport = require('passport');

var mainController = {};

mainController.content = {};

mainController.index = function(req, res, next) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.title = "Login";
    self.content.layout = false;
    self.content.flash = req.flash('loginMessage');


    res.render('login', self.content);
};

mainController.dashboard = function(req, res, next) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.title = "Dashboard";
    self.content.nav = 'dashboard';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

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