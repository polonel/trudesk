var async = require('async'),
    _ = require('underscore'),
    _mixins = require('../helpers/underscore'),
    passport = require('passport'),
    ticketSchema = require('../models/ticket');

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
    var self = mainController;
    self.content = {};
    self.content.title = "Dashboard";
    self.content.nav = 'dashboard';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.summary = {};

    async.parallel({
        totalCount: function(callback) {
            ticketSchema.getTotalCount(function(err, count) {
                if (err) return callback(err, null);
                callback(null, count);
            });
        },
        newCount: function(callback) {
            ticketSchema.getStatusCount(0, function(err, count) {
                if (err) return callback(err, null);
                callback(null, count);
            });
        },
        activeCount: function(callback) {
            async.series([
                function(cb) {
                    ticketSchema.getStatusCount(1, function(err, count) {
                        if (err) return cb(err, null);

                        cb(null, count);
                    });
                },
                function(cb) {
                    ticketSchema.getStatusCount(2, function(err, count) {
                        if (err) return cb(err, null);

                        cb(null, count);
                    });
                }
            ], function(err, results) {
                if (err) return callback(err, null);
                var aCount = _.sum(results);

                callback(null, aCount);
            });
        },
        closedCount: function(callback) {
            ticketSchema.getStatusCount(3, function(err, count) {
                if (err) return callback(err, null);

                callback(null, count);
            });
        }
    }, function(err, results) {
        var activePercent = (results.activeCount / results.totalCount)*100;
        var newPercent = (results.newCount / results.totalCount)*100;
        var completedPercent = (results.closedCount / results.totalCount)*100;
        activePercent = Math.round(activePercent);
        completedPercent = Math.round(completedPercent);
        newPercent = Math.round(newPercent);
        self.content.data.summary.totalCount = results.totalCount;
        self.content.data.summary.newCount = results.newCount;
        self.content.data.summary.newPercent = newPercent;
        self.content.data.summary.activeCount = results.activeCount;
        self.content.data.summary.activePercent = activePercent;
        self.content.data.summary.completedPercent = completedPercent;

        res.render('dashboard', self.content);
    });
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