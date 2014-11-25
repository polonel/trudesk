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

    if (permissions.canThis('modo', 'mod:create')) console.log('PERMISSION GRANTED');

    res.render('accounts', self.content);
};

module.exports = accountsController;