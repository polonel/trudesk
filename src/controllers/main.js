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
    _mixins         = require('../helpers/underscore'),
    passport        = require('passport'),
    ticketSchema    = require('../models/ticket'),
    settingSchema   = require('../models/setting'),
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

    return res.render('dashboard', self.content);
};

mainController.loginPost = function(req, res, next) {
    passport.authenticate('local', function(err, user) {
        if (err) {
            winston.error(err);
            return next(err);
        }
        if (!user) return res.redirect('/');

        var redirectUrl = '/dashboard';

        if (req.session.redirectUrl) {
            redirectUrl = req.session.redirectUrl;
            req.session.redirectUrl = null;
        }

        req.logIn(user, function(err) {
            if (err) return next(err);

            return res.redirect(redirectUrl);
        });
    })(req, res, next);
};

mainController.l2AuthPost = function(req, res, next) {
    if (!req.user)
        return res.redirect('/');
    passport.authenticate('totp', function(err, success) {
        if (err) {
            winston.error(err);
            return next(err);
        }

        if (!success) return res.redirect('/l2auth');

        req.session.l2auth = 'totp';

        var redirectUrl = '/dashboard';

        if (req.session.redirectUrl) {
            redirectUrl = req.session.redirectUrl;
            req.session.redirectUrl = null;
        }

        return res.redirect(redirectUrl);
    })(req, res, next);
};

mainController.logout = function(req, res) {
    req.logout();
    req.session.l2auth = null;
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
    if (!req.user)
        return res.redirect('/');

    var self = mainController;
    self.content = {};
    self.content.title = "Login";
    self.content.layout = false;

    res.render('login-otp', self.content);
};

module.exports = mainController;