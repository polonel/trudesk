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
    self.content.subnav = 'settings-general';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    settingSchema.getSettings(function(err, settings) {
        if (err) return handleError(res, 'Invalid Settings');

        var s = {};
        s.mailerEnabled = _.find(settings, function(x){return x.name === 'mailer:enable'});
        s.mailerHost = _.find(settings, function(x) { return x.name === 'mailer:host'});
        s.mailerSSL = _.find(settings, function(x) { return x.name === 'mailer:ssl'});
        s.mailerPort = _.find(settings, function(x) { return x.name === 'mailer:port'});
        s.mailerUsername = _.find(settings, function(x) { return x.name === 'mailer:username'});
        s.mailerPassword = _.find(settings, function(x) { return x.name === 'mailer:password'});
        s.mailerFrom = _.find(settings, function(x) { return x.name === 'mailer:from'});

        s.mailerEnabled = (s.mailerEnabled === undefined) ? {value: false} : s.mailerEnabled;
        s.mailerSSL = (s.mailerSSL === undefined) ? {value: false} : s.mailerSSL;
        s.mailerHost = (s.mailerHost === undefined) ? {value: ''} : s.mailerHost;
        s.mailerPort = (s.mailerPort === undefined) ? {value: 25} : s.mailerPort;
        s.mailerUsername = (s.mailerUsername === undefined) ? {value: ''} : s.mailerUsername;
        s.mailerPassword = (s.mailerPassword === undefined) ? {value: ''} : s.mailerPassword;
        s.mailerFrom = (s.mailerFrom === undefined) ? {value: ''} : s.mailerFrom;

        s.mailerCheckEnabled = _.find(settings, function(x) { return x.name === 'mailer:check:enable' });
        s.mailerCheckHost = _.find(settings, function(x) { return x.name === 'mailer:check:host' });
        s.mailerCheckPort = _.find(settings, function(x) { return x.name === 'mailer:check:port' });
        s.mailerCheckUsername = _.find(settings, function(x) { return x.name === 'mailer:check:username' });
        s.mailerCheckPassword = _.find(settings, function(x) { return x.name === 'mailer:check:password' });

        s.mailerCheckEnabled = (s.mailerCheckEnabled === undefined) ? {value: false} : s.mailerCheckEnabled;
        s.mailerCheckHost = (s.mailerCheckHost === undefined) ? {value: ''} : s.mailerCheckHost;
        s.mailerCheckPort = (s.mailerCheckPort === undefined) ? {value: 143} : s.mailerCheckPort;
        s.mailerCheckUsername = (s.mailerCheckUsername === undefined) ? {value: ''} : s.mailerCheckUsername;
        s.mailerCheckPassword = (s.mailerCheckPassword === undefined) ? {value: ''} : s.mailerCheckPassword;

        s.showOverdueTickets = _.find(settings, function(x) { return x.name === 'showOverdueTickets:enable' });

        s.showOverdueTickets = (s.showOverdueTickets === undefined) ? {value: true} : s.showOverdueTickets;

        s.tpsEnabled = _.find(settings, function(x) { return x.name === 'tps:enable' });

        s.tpsEnabled = (s.tpsEnabled === undefined) ? {value: false} : s.tpsEnabled;

        self.content.data.settings = s;

        res.render('settings', self.content);
    });
};

settingsController.logs = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'settings:logs')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Server Logs";
    self.content.nav = 'settings';
    self.content.subnav = 'settings-logs';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    var fs = require('fs'),
        path = require('path'),
        ansi_up = require('ansi_up'),
        file = path.join(__dirname, '../../logs/output.log');

    fs.readFile(file, 'utf-8', function(err, data) {
        if (err)  {
            self.content.data.logFileContent = err;
            return res.render('logs', self.content);
        }

        self.content.data.logFileContent = data.toString().trim().replace(/\n/g, "<br />");
        self.content.data.logFileContent = ansi_up.ansi_to_html(self.content.data.logFileContent);

        return res.render('logs', self.content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = settingsController;