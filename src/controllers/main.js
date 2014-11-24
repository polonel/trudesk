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

mainController.loginPost = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) return next(err);
        if (!user) return res.redirect('/');

        var redirectUrl = '/dashboard';

        if (req.session.redirectUrl) {
            redirectUrl = req.session.redirectUrl;
            req.session.redirectUrl = null;
        }

        req.logIn(user, function(err) {
            if (err) return next(err);

            return res.redirect(redirectUrl);
        })
    })(req, res, next);
};

mainController.logout = function(req, res, next) {
    "use strict";
    req.logout();
    res.redirect('/');
};



module.exports = mainController;