/*
      .                             .o8                     oooo
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

var groupsController = {};

groupsController.content = {};

groupsController.get = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Groups";
    self.content.nav = 'groups';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.groups = {};
    self.content.data.users = [];

    groupSchema.getAllGroups(function(err, groups) {
        if (err) handleError(res, err);

        self.content.data.groups = _.sortBy(groups, 'name');

        userSchema.findAll(function(err, users) {
            if (err) handleError(res, err);

            self.content.data.users = _.sortBy(users, 'fullname');

            res.render('groups', self.content);
        });
    });
};

groupsController.getCreate = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Groups";
    self.content.nav = 'groups';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.groups = {};
    self.content.data.users = [];

    userSchema.findAll(function(err, users) {
        if (err) return handleError(res, err);

        self.content.data.users = _.sortBy(users, "fullname");

        res.render('subviews/createGroup', self.content);
    });
};

groupsController.edit = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Groups";
    self.content.nav = 'groups';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.users = [];
    var groupId = req.params.id;
    if (_.isUndefined(groupId)) return res.redirect('/groups/');

    async.parallel({
        users: function(next) {
            userSchema.findAll(function(err, users) {
                if (err) return next(err);

                next(null, users);
            });
        },
        group: function (next) {
            groupSchema.getGroupById(groupId, function (err, group) {
                if (err) return next(err);

                next(null, group);
            });
        }
        }, function(err, done) {
            if (err) return handleError(res, err);

            self.content.data.users =  _.sortBy(done.users, 'fullname');
            self.content.data.group = done.group;

            res.render('subviews/editGroup', self.content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = groupsController;