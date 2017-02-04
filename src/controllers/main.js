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

var async           = require('async'),
    path            = require('path'),
    _               = require('underscore'),
    //_mixins         = require('../helpers/underscore'),
    passport        = require('passport'),
    ticketSchema    = require('../models/ticket'),
    nconf           = require('nconf'),
    winston         = require('winston');

var mainController = {};

mainController.content = {};

mainController.index = function(req, res) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.title = "Login";
    self.content.layout = false;
    self.content.flash = req.flash('loginMessage');

    var settings = require('../models/setting');
    settings.getSettingByName('allowUserRegistration:enable', function(err, setting) {
        if (err) {
            winston.warn(err);
            return res.render('login', self.content);
        }

        if (!_.isNull(setting))
            self.content.allowUserRegistration = setting.value;

        return res.render('login', self.content);
    });

};

mainController.about = function(req, res) {
    var pkg = require('../../package.json');
    var settings = require('../models/setting');
    settings.getSettingByName('legal:privacypolicy', function(err, privacyPolicy) {
        var self = {};
        self.content = {};
        self.content.title = "About";
        self.content.nav = 'about';

        self.content.data = {};
        self.content.data.user = req.user;
        self.content.data.common = req.viewdata;

        self.content.data.version = pkg.version;
        if (privacyPolicy == null || _.isUndefined(privacyPolicy.value))
            self.content.data.privacyPolicy = 'No Privacy Policy has been set.';
        else
            self.content.data.privacyPolicy = privacyPolicy.value;

        return res.render('about', self.content);
    });
};

mainController.dashboard = function(req, res) {
    var self = mainController;
    self.content = {};
    self.content.title = "Dashboard";
    self.content.nav = 'dashboard';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.summary = {};
    self.content.data.dailycount = {};

    async.parallel({
        totalCount: function(callback) {
            ticketSchema.getTotalCount(function(err, count) {
                if (err) return callback(err, null);
                return callback(null, count);
            });
        },
        totalMonthCount: function(callback) {
            var month = new Date().getMonth();
            ticketSchema.getTotalMonthCount(month, function(err, count) {
                if (err) return callback(err, null);
                return callback(null, count);
            });
        },
        closedMonthCount: function(callback) {
            var month = new Date().getMonth();
            ticketSchema.getMonthCount(month, 3, function(err, count) {
                if (err) return callback(err, null);
                return callback(null, count);
            });
        },
        newCount: function(callback) {
            ticketSchema.getStatusCount(0, function(err, count) {
                if (err) return callback(err, null);
                return callback(null, count);
            });
        },
        activeCount: function(callback) {
            async.series([
                function(cb) {
                    ticketSchema.getStatusCount(1, function(err, count) {
                        if (err) return cb(err, null);

                        return cb(null, count);
                    });
                },
                function(cb) {
                    ticketSchema.getStatusCount(2, function(err, count) {
                        if (err) return cb(err, null);

                        return cb(null, count);
                    });
                }
            ], function(err, results) {
                if (err) return callback(err, null);
                var aCount = _.sum(results);

                return callback(null, aCount);
            });
        },
        closedCount: function(callback) {
            ticketSchema.getStatusCount(3, function(err, count) {
                if (err) return callback(err, null);

                return callback(null, count);
            });
        },
        dailyCount: function(callback) {
            var dates = [];
            for (var i = 0; i < 14; i++) {
                var today = new Date();
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                today.setDate(today.getDate()-i);
                dates.push(today.toISOString());
            }

            dates.reverse();

            var final = {};
            async.series([
                function(next) {
                    async.forEachOf(dates, function(value, k, cb) {
                        (function(key) {
                            final[key] = {date: dates[key]};

                            async.series({
                                total: function(next) {
                                    ticketSchema.getDateCount(dates[key], function(err, c) {
                                        if (err) return next(null, 0);

                                        return next(null, c);
                                    });
                                },
                                closedCount: function(next) {
                                    ticketSchema.getStatusCountByDate(3, dates[key], function(err, c) {
                                        if (err) return next(null, 0);

                                        return next(null, c);
                                    });
                                }
                            }, function(err, done) {
                                final[key].total = done.total;
                                final[key].closedCount = done.closedCount;

                                final[key].percent = (done.total / 25)*100;

                                return cb();
                            });
                        })(k);
                    }, function(err) {
                        return next(err, final);
                    });
                }
            ], function(err) {
                return callback(err, final);
            });
        }
    }, function(err, results) {
        var activePercent = (results.activeCount / results.totalCount)*100;
        var newPercent = (results.newCount / (results.activeCount + results.newCount))*100;
        var completedPercent = (results.closedMonthCount / results.totalMonthCount)*100;
        if (isNaN(completedPercent)) completedPercent = 0;
        if (isNaN(activePercent)) activePercent = 0;
        if (isNaN(newPercent)) newPercent = 0;
        activePercent = Math.round(activePercent);
        completedPercent = Math.round(completedPercent);
        newPercent = Math.round(newPercent);
        if (completedPercent > 100) completedPercent = 100;
        if (self.content.data.summary == undefined) self.content.data.summary = {};
        self.content.data.summary.totalCount = results.totalCount;
        self.content.data.summary.newCount = results.newCount;
        self.content.data.summary.newPercent = newPercent;
        self.content.data.summary.activeCount = results.activeCount;
        self.content.data.summary.activePercent = activePercent;
        self.content.data.summary.completedPercent = completedPercent;

        self.content.data.dailycount = results.dailyCount;
        self.content.data.dailyYAxis = {};

        var maxNewCount = _.max(_.pluck(results.dailyCount, "newCount"));
        var maxClosedCount = _.max(_.pluck(results.dailyCount, "closedCount"));
        var max = _.max([maxNewCount, maxClosedCount]);
        self.content.data.dailyYAxis.maxValue = 25;
        self.content.data.dailyYAxis.v1 = 15;
        self.content.data.dailyYAxis.v2 = 10;
        self.content.data.dailyYAxis.v3 = 5;
        if (max > 25) {
            self.content.data.dailyYAxis.maxValue = 50;
            self.content.data.dailyYAxis.v1 = 35;
            self.content.data.dailyYAxis.v2 = 20;
            self.content.data.dailyYAxis.v3 = 5;
        }

        return res.render('dashboard', self.content);
    });
};

mainController.loginPost = function(req, res, next) {
    passport.authenticate('local', function(err, user) {
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

mainController.logout = function(req, res) {
    req.logout();
    req.session.destroy();
    return res.redirect('/');
};

mainController.forgotPass = function(req, res) {
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
                        winston.warn(err.message);
                        return res.status(400).send(err.message);
                    }

                    var mailOptions = {
                        from: nconf.get('mailer:from'),
                        to: email,
                        subject: '[TruDesk] Password Reset Request',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err) {
                        if (err) {
                            req.flash('Error: ' + err.message);
                            winston.warn(err.message);
                            return res.status(400).send(err.message);
                        }

                        return res.status(200).send();
                    });
                });
            });
        });
    });
};

mainController.resetPass = function(req, res) {
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

                        mailer.sendMail(mailOptions, function(err) {
                            if (err) {
                                req.flash('Error: ' + err.message);
                                return res.status(500).send(err.message);
                            }

                            return res.render('login', { flash: { success: true, message: 'Password Reset Successful' } });
                        });
                    });
                });
            });
        }
    });
};

mainController.l2authget = function(req, res) {
    "use strict";
    var self = mainController;
    self.content = {};
    self.content.title = "Login";
    self.content.layout = false;


    res.render('login-otp', self.content);
};

module.exports = mainController;