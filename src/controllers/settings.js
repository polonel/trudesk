/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    06/23/2016
 Author:     Chris Brame

 **/

var async           = require('async');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var settingSchema    = require('../models/setting');
var permissions     = require('../permissions');
var mongoose        = require('mongoose');

var settingsController = {};

settingsController.content = {};

settingsController.get = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'settings:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Settings";
    self.content.nav = 'settings';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    settingSchema.getSettings(function(err, settings) {
        if (err) return handleError(res, 'Invalid Settings');

        var s = {};
        s.mailerEnabled = _.find(settings, function(x){return x.name === 'mailer:enable'});
        s.mailerHost = _.find(settings, function(x) { return x.name === 'mailer:host'});
        s.mailerPort = _.find(settings, function(x) { return x.name === 'mailer:port'});
        s.mailerUsername = _.find(settings, function(x) { return x.name === 'mailer:username'});
        s.mailerPassword = _.find(settings, function(x) { return x.name === 'mailer:password'});
        s.mailerFrom = _.find(settings, function(x) { return x.name === 'mailer:from'});

        s.mailerEnabled = (s.mailerEnabled === undefined) ? {value: true} : s.mailerEnabled;
        s.mailerHost = (s.mailerHost === undefined) ? {value: ''} : s.mailerHost;
        s.mailerPort = (s.mailerPort === undefined) ? {value: 25} : s.mailerPort;
        s.mailerUsername = (s.mailerUsername === undefined) ? {value: ''} : s.mailerUsername;
        s.mailerPassword = (s.mailerPassword === undefined) ? {value: ''} : s.mailerPassword;
        s.mailerFrom = (s.mailerFrom === undefined) ? {value: ''} : s.mailerFrom;

        self.content.data.settings = s;

        res.render('settings', self.content);
    });
};

settingsController.create = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Notices - Create";
    self.content.nav = 'notices';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    res.render('subviews/createNotice', self.content);
};

settingsController.edit = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Notices - Edit";
    self.content.nav = 'notices';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    noticeSchema.getNotice(req.params.id, function(err, notice) {
        if (err) return handleError(res, err);
        self.content.data.notice = notice;

        res.render('subviews/editNotice', self.content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = settingsController;