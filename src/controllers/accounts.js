var async           = require('async');
var _               = require('lodash');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var groupSchema     = require('../models/group');
var permissions     = require('../permissions');

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
                    if (!g) { c(); return;}
                    user.groups = [];
                    _.each(g, function(gg) {
                        user.groups.push(gg.name)
                    });
                    result.push(user);
                    c();
                })
            }, function(err) {
                callback(null, result);
            });
        }
    ], function(err, rr) {
        if (err) return res.render('error', err);
        self.content.data.accounts = rr;

        res.render('accounts', self.content);
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

    userSchema.getUser(req.body.aId, function(err, u) {
        if (err) handleError(res, err);

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
            if (err) handleError(res, err);

            return res.redirect('/accounts/' + u.username);
        })
    })
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
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;

            res.render('subviews/createaccount', self.content);
        }
    });
};

accountsController.postCreate = function(req, res, next) {
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

    res.sendStatus(200);
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