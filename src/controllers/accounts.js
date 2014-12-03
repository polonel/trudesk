var async           = require('async');
var _               = require('lodash');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var groupSchema     = require('../models/group');
var permissions     = require('../permissions');

var accountsController = {};

accountsController.content = {};

accountsController.get = function(req, res, next) {
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
        }
    ], function(err, result) {
        if (err) return res.render('error', err);
        self.content.data.accounts = result;

        res.render('accounts', self.content);
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

accountsController.postAccount = function(req, res, next) {
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

module.exports = accountsController;