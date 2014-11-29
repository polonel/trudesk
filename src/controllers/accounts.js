var async           = require('async');
var _               = require('lodash');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
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

    async.waterfall([
        function(callback) {

            callback();
        }
    ], function(err, result) {

        res.render('accounts', self.content);
    });
};

accountsController.postAccount = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(req.user.role, 'account:create')) {
        return res.render('accounts', {errMessage: 'Permission Denied.'});
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = user;
    self.content.data.common = req.viewdata;

};

module.exports = accountsController;