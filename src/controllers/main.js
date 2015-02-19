/**
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

var async = require('async'),
    path = require('path'),
    _ = require('underscore'),
    _mixins = require('../helpers/underscore'),
    passport = require('passport'),
    ticketSchema = require('../models/ticket'),
    nconf = require('nconf');

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

mainController.forgotPass = function(req, res, next) {
    var data = req.body;
    if (_.isUndefined(data['forgotPass-email'])) {
        return res.send(400).send('No Form Data');
    }

    var email = data['forgotPass-email'];
    var userSchema = require('../models/user');
    userSchema.getUserByEmail(email, function(err, user) {
        if (err) {
            req.flash(err);
            return res.status(400).send(err.message);
        }

        if (_.isUndefined(user) || _.isEmpty(user)) {
            req.flash('Invalid Email: Account not found!');
            return res.status(400).send('Invalid Email: Account not found!');
        }

        // Found user send Password Reset Email.
        //Set User Reset Hash and Expire Date.
        var Chance = require('chance');
        var chance = new Chance();

        user.resetPassHash = chance.hash({casing: 'upper'});
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 2);
        user.resetPassExpire = expireDate;

        user.save(function(err, savedUser) {
            if (err) {
                req.flash(err);
                return res.status(400).send(err.message);
            }

            //Send mail
            var mailer          = require('../mailer');
            var emailTemplates  = require('email-templates');
            var templateDir     = path.resolve(__dirname, '..', 'mailer', 'templates');

            emailTemplates(templateDir, function(err, template) {
                if (err) {
                    req.flash('Error: ' + err);
                    return res.status(400).send(err.message);
                }

                var data = {
                    base_url: nconf.get('url'),
                    user: savedUser
                };

                template('password-reset', data, function(err, html) {
                    if (err) {
                        req.flash('Error: ' + err);
                        return res.status(400).send(err.message);
                    }

                    var mailOptions = {
                        from: 'no-reply@trudesk.io',
                        to: email,
                        subject: '[TruDesk] Password Reset Request',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err, info) {
                        if (err) {
                            req.flash('Error: ' + err.message);
                            return res.status(400).send(err.message);
                        }

                        return res.status(200).send();
                    });
                });
            });
        });
    });
};

mainController.resetPass = function(req, res, next) {
    var hash = req.params.hash;

    if (_.isUndefined(hash)) {
        return res.status(400).send('Invalid Link!');
    }

    var userSchema = require('../models/user');
    userSchema.getUserByResetHash(hash, function(err, user) {
        if (err) {
            return res.status(400).send('Invalid Link!');
        }

        if (_.isUndefined(user) || _.isEmpty(user)) {
            return res.status(400).send('Invalid Link!');
        }

        var now = new Date();
        if (now < user.resetPassExpire) {
            var Chance = require('chance');
            var chance = new Chance();
            var gPass = chance.string({length: 8});
            user.password = gPass;

            user.resetPassHash = undefined;
            user.resetPassExpire = undefined;

            user.save(function(err, updated) {
                if (err) {
                    return res.status(500).send(err.message);
                }

                //Send mail
                var mailer          = require('../mailer');
                var emailTemplates  = require('email-templates');
                var templateDir     = path.resolve(__dirname, '..', 'mailer', 'templates');

                emailTemplates(templateDir, function(err, template) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }

                    var data = {
                        password: gPass,
                        user: updated
                    };

                    template('new-password', data, function(err, html) {
                        if (err) {
                            req.flash('Error: ' + err);
                            return res.status(500).send(err.message);
                        }

                        var mailOptions = {
                            from: 'no-reply@trudesk.io',
                            to: updated.email,
                            subject: '[TruDesk] New Password',
                            html: html,
                            generateTextFromHTML: true
                        };

                        mailer.sendMail(mailOptions, function(err, info) {
                            if (err) {
                                req.flash('Error: ' + err.message);
                                return res.status(500).send(err.message);
                            }

                            return res.redirect('/');
                        });
                    });
                });
            });
        }
    });
};

module.exports = mainController;