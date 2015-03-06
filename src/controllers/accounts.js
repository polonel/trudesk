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

var async           = require('async');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var groupSchema     = require('../models/group');
var permissions     = require('../permissions');
var mongoose        = require('mongoose');

var accountsController = {};

accountsController.content = {};

accountsController.get = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'account:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.accounts = {};

    async.waterfall([
        function(callback) {
            userSchema.findAll(function(err, results) {
                callback(err, results);
            });

        }, function (users, callback) {
            var result = [];
            async.eachSeries(users, function(u, c) {
                var user = u.toObject();
                groupSchema.getAllGroupsOfUser(user._id, function(err, g) {
                    if (!g) { return c();}
                    var groups = [];
                    _.each(g, function(gg) {
                        groups.push(gg.name)
                    });
                    user.groups = _.sortBy(groups, 'name');
                    result.push(user);
                    c();
                })
            }, function(err) {
                if (err) return callback(err);
                callback(null, result);
            });
        }
    ], function(err, rr) {
        if (err) return res.render('error', err);
        self.content.data.accounts = rr;

        res.render('accounts', self.content);
    });
};

accountsController.profile = function(req, res, next) {
    var user = req.user;
    var backUrl = req.header('Referer') || '/';
    if (_.isUndefined(user)) {
        req.flash('message', 'Permission Denied.');
        winston.warn('Undefined User - /Profile');
        return res.redirect(backUrl);
    }

    var self = this;
    self.content = {};
    self.content.title = "Profile";
    self.content.nav = 'profile';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.account = {};

    async.parallel({
        account: function(callback) {
            userSchema.getUser(req.user._id, function (err, obj) {
                callback(err, obj);
            });
        }
    }, function(err, result) {
        if (err) {
            req.flash('message', err.message);
            winston.warn(err);
            return res.redirect(backUrl);
        }

        self.content.data.account = result.account;

        res.render('subviews/profile', self.content);
    });
};

accountsController.editAccount = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'account:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var username = req.params.username;
    if (_.isUndefined(username)) {
        req.flash('message', 'Invalid User.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.account = {};

    async.parallel({
        roles: function (callback) {
            callback(null, permissions.roles);
        },

        groups: function(callback) {
            groupSchema.getAllGroups(function(err, grps) {
                callback(err, grps);
            });
        },

        account: function(callback) {
            userSchema.getUserByUsername(username, function (err, obj) {
                callback(err, obj);
            });
        }
    }, function(err, result) {
        if (err) {
            req.flash('message', err.message);
            winston.warn(err);
            return res.redirect('/accounts');
        }

        self.content.data.account = result.account;
        self.content.data.roles = result.roles;
        self.content.data.groups = _.sortBy(result.groups, 'name');

        res.render('subviews/editAccount', self.content);
    });
};

accountsController.postEdit = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'account:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = user;
    self.content.data.common = req.viewdata;

    async.parallel({
        groups: function(callback) {
            var gIds = req.body.aGrps;

            if (!_.isArray(gIds)) {
                gIds = [gIds];
            }
            var aId = req.body.aId;
            groupSchema.getAllGroups(function(err, grps) {
                if (err) return callback(err, null);

                async.each(grps, function(grp, c) {
                    // Adding User to Group
                    if (_.contains(gIds, grp._id.toString())) {
                        grp.addMember(aId, function(err, result) {
                           if (result) {
                               grp.save(function(err) {
                                   if (err) return c(err);
                                   c();
                               })
                           } else {
                               c();
                           }
                        });
                    } else {
                        //Remove User from Group
                        grp.removeMember(aId, function(err, result) {
                            if (result) {
                                grp.save(function (err) {
                                    if (err) return c(err);

                                    c();
                                });
                            } else {
                                c();
                            }
                        });
                    }

                }, function(err) {
                    if (err) return callback(err, null);

                    callback(null, true);
                });
            });
        },

        user: function(callback) {
            userSchema.getUser(req.body.aId, function(err, u) {
                if (err) return callback(err, null);

                u.fullname = req.body.aFullname;
                u.title = req.body.aTitle;
                u.email = req.body.aEmail;
                u.role = req.body.aRole;

                if (!_s.isBlank(req.body.aPass)) {
                    var pass = req.body.aPass;
                    var cPass = req.body.aPassConfirm;

                    if (pass == cPass) {
                        u.password = cPass;
                    }
                }

                u.save(function(err) {
                    if (err) return callback(err, null);

                    callback(null, u);
                })
            })
        }

    }, function(err, results) {
        if (err) return handleError(res, err);
        //if (!res.groups) return handleError(res, {message: 'Unable to Save Groups for User'});

        return res.redirect('/accounts/' + results.user.username);
    });
};

accountsController.createAccount = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'account:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.accounts = {};

    async.parallel({
        groups: function(callback) {
            groupSchema.getAllGroups(function(err, grps) {
                callback(err, grps);
            });
        },
        roles: function(callback) {
            callback(null, permissions.roles);
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
            if (!_.isUndefined(results.roles)) self.content.data.roles = results.roles;

            res.render('subviews/createAccount', self.content);
        }
    });
};

accountsController.postCreate = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'account:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = user;
    self.content.data.common = req.viewdata;

    var username = req.body.aUsername;
    var fullname = req.body.aFullname;
    var title = req.body.aTitle;
    var password = req.body.aPass;
    var confirmPass = req.body.aPassConfirm;
    var email = req.body.aEmail;
    var role = req.body.aRole;
    var groups = req.body.aGrps;

    //Todo Error and Resend to correct page
    if (password !== confirmPass) return handleError(res, {message: "Password Mismatch"});

    var User = userSchema;

    var newUser = new User({
        username: username,
        password: password,
        fullname: fullname,
        email: email,
        title: title,
        role: role
    });

    newUser.save(function(err, obj) {
        if (err) return handleError(res, err);
        if (_.isUndefined(obj)) return handleError(res, {message: "Invalid Obj"});

        if (!_.isArray(groups)) {
            groups = [groups];
        }

        async.each(groups, function(g, callback) {
            if (_.isUndefined(g)) return callback(null);

            groupSchema.getGroupById(g, function(err, grp) {
                if (err) return callback(err);
                grp.addMember(obj._id, function(err, success) {
                    if (err) return callback(err);

                    grp.save(function(err) {
                        if (err) return callback(err);
                        callback(null, success);
                    });
                });
            });
        }, function(err) {
            if (err) return handleError(res, err);

            res.redirect('/accounts');
        });
    });
};

accountsController.uploadImage = function(req, res, next) {
    var self = this;
    var id = req.body._id;
    var username = req.body.username;

    userSchema.getUser(id, function(err, user) {
        if (err) return handleError(res, err);

        var fileName = 'aProfile_' + username + '.' + req.files["aProfile_" + username].extension;
        user.image = fileName;

        user.save(function(err) {
            if (err) return handleError(res, err);

            return res.status(200).send('/uploads/users/' + fileName);
        });
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = accountsController;