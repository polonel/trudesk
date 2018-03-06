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

var _               = require('lodash'),
    path            = require('path'),
    passport        = require('passport'),
    winston         = require('winston');

var mainController = {};

mainController.content = {};

mainController.index = function(req, res) {
    var content = {};
    content.title = "Login";
    content.layout = false;
    content.flash = req.flash('loginMessage');

    var settings = require('../models/setting');
    settings.getSettingByName('allowUserRegistration:enable', function(err, setting) {
        if (err) {
            throw new Error(err);
        }

        if (!_.isNull(setting))
            content.allowUserRegistration = setting.value;
        settings.getSettingByName('mailer:enable', function(err, setting) {
            if (err) {
                throw new Error(err);
            }

            if (!_.isNull(setting))
                content.mailerEnabled = setting.value;

            return res.render('login', content);
        });
    });

};

mainController.about = function(req, res) {
    var pkg = require('../../package.json');
    var settings = require('../models/setting');
    settings.getSettingByName('legal:privacypolicy', function(err, privacyPolicy) {
        var content = {};
        content.title = "About";
        content.nav = 'about';

        content.data = {};
        content.data.user = req.user;
        content.data.common = req.viewdata;

        content.data.version = pkg.version;
        if (privacyPolicy == null || _.isUndefined(privacyPolicy.value))
            content.data.privacyPolicy = 'No Privacy Policy has been set.';
        else
            content.data.privacyPolicy = privacyPolicy.value;

        return res.render('about', content);
    });
};

mainController.dashboard = function(req, res) {
    var content = {};
    content.title = "Dashboard";
    content.nav = 'dashboard';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    return res.render('dashboard', content);
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
            if (err) {
                winston.debug(err);
                return next(err);
            }

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

mainController.forgotL2Auth = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data['forgotl2auth-email']))
        return res.status(400).send('No Form Data');

    var email = data['forgotl2auth-email'];
    var userSchema = require('../models/user');
    userSchema.getUserByEmail(email, function(err, user) {
        if (err) {
            return res.status(400).send(err.message);
        }

        if (!user) {
            return res.status(400).send('Invalid Email: Account not found!');
        }

        var Chance = require('chance');
        var chance = new Chance();

        user.resetL2AuthHash = chance.hash({casing: 'upper'});
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 2);
        user.resetL2AuthExpire = expireDate;

        user.save(function(err, savedUser) {
            if (err)
                return res.status(400).send(err.message);

            var mailer = require('../mailer');
            var Email = require('email-templates');
            var templateDir = path.resolve(__dirname, '..', 'mailer', 'templates');

            var email = new Email({
                views: {
                    root: templateDir,
                    options: {
                        extension: 'handlebars'
                    }
                }
            });

            var data = {
                base_url: req.protocol + '://' + req.get('host'),
                user: savedUser
            };

            email.render('l2auth-reset', data)
                .then(function(html) {
                    var mailOptions = {
                        to: savedUser.email,
                        subject: '[Trudesk] Account Recovery',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err) {
                        if (err) {
                            winston.warn(err);
                            return res.status(400).send(err);
                        } else {
                            return res.send('OK');
                        }
                    });
                })
                .catch(function(err) {
                    winston.warn(err);
                    return res.status(400).send(err.message);
                })
        });
    })
};

mainController.forgotPass = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data['forgotPass-email'])) {
        return res.status(400).send('No Form Data');
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
            var Email           = require('email-templates');
            var templateDir     = path.resolve(__dirname, '..', 'mailer', 'templates');

            var email = new Email({
                views: {
                    root: templateDir,
                    options: {
                        extension: 'handlebars'
                    }
                }
            });

            var data = {
                base_url: req.protocol + '://' + req.get('host'),
                user: savedUser
            };

            email.render('password-reset', data)
                .then(function(html) {
                    var mailOptions = {
                        to: savedUser.email,
                        subject: '[Trudesk] Password Reset Request',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err) {
                        if (err) {
                            winston.warn(err);
                            return res.status(400).send(err);
                        } else {
                            return res.status(200).send();
                        }
                    });
                })
                .catch(function(err) {
                    req.flash('loginMessage', 'Error: ' + err);
                    winston.warn(err);
                    return res.status(400).send(err.message);
                });
        });
    });
};

mainController.resetl2auth = function(req, res) {
    var hash = req.params.hash;
    if (_.isUndefined(hash))
        return res.status(400).send('Invalid Link!');

    var userSchema = require('../models/user');
    userSchema.getUserByL2ResetHash(hash, function(err, user) {
        if (err)
            return res.status(400).send('Invalid Link!');

        if (_.isUndefined(user) || _.isEmpty(user))
            return res.status(400).send('Invalid Link!');

        var now = new Date();
        if (now < user.resetL2AuthExpire) {
            user.tOTPKey = undefined;
            user.hasL2Auth = false;
            user.resetL2AuthHash = undefined;
            user.resetL2AuthExpire = undefined;

            user.save(function(err, updated) {
                if (err) {
                    return res.status(500).send(err.message);
                }

                //Send mail
                var mailer          = require('../mailer');
                var Email           = require('email-templates');
                var templateDir     = path.resolve(__dirname, '..', 'mailer', 'templates');

                var email = new Email({
                    views: {
                        root: templateDir,
                        options: {
                            extension: 'handlebars'
                        }
                    }
                });

                email.render('l2auth-cleared', user)
                    .then(function(html) {
                        var mailOptions = {
                            to: updated.email,
                            subject: '[Trudesk] Two-Factor Authentication Removed!',
                            html: html,
                            generateTextFromHTML: true
                        };

                        mailer.sendMail(mailOptions, function(err) {
                            if (err) {
                                winston.warn(err);
                                req.flash('loginMessage', err.message);
                                return res.redirect(307, '/');
                            }

                            req.flash('loginMessage', 'Account Recovery Email Sent.');
                            return mainController.logout(req, res);
                        });
                    })
                    .catch(function(err) {
                        winston.warn(err);
                        req.flash('loginMessage', err.message);
                        return res.status(400).send(err.message);
                    });
            });
        } else {
            return res.status(400).send('Invalid Link!');
        }
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
                var Email           = require('email-templates');
                var templateDir     = path.resolve(__dirname, '..', 'mailer', 'templates');

                var email = new Email({
                    views: {
                        root: templateDir,
                        options: {
                            extension: 'handlebars'
                        }
                    }
                });

                var data = {
                    password: gPass,
                    user: updated
                };

                email.render('new-password', data)
                    .then(function(html) {
                        var mailOptions = {
                            to: updated.email,
                            subject: '[Trudesk] New Password',
                            html: html,
                            generateTextFromHTML: true
                        };

                        mailer.sendMail(mailOptions, function(err) {
                            if (err) {
                                winston.warn(err);
                                req.flash('loginMessage', err.message);
                                return res.redirect(307, '/');
                            }

                            req.flash('loginMessage', 'Password reset successfully');
                            return res.redirect(307, '/');
                        });
                    })
                    .catch(function(err) {
                        winston.warn(err);
                        req.flash('Error: ' + err.message);
                        res.status(400).send(err.message);
                    });
            });
        }
    });
};

mainController.l2authget = function(req, res) {
    if (!req.user || !req.user.hasL2Auth) {
        req.logout();
        return res.redirect('/');
    }

    var content = {};
    content.title = "Login";
    content.layout = false;

    var settings = require('../models/setting');
    settings.getSettingByName('mailer:enable', function(err, setting) {
        if (err) {
            throw new Error(err);
        }

        if (!_.isNull(setting))
            content.mailerEnabled = setting.value;

        return res.render('login-otp', content);
    });
};

function parseUrl(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

module.exports = mainController;
