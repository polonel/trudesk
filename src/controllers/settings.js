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

var async               = require('async');
var _                   = require('lodash');
var winston             = require('winston');
var jsStringEscape      = require('js-string-escape');
var settingSchema       = require('../models/setting');
var tagSchema           = require('../models/tag');
var ticketTypeSchema    = require('../models/tickettype');
var permissions         = require('../permissions');

var settingsController = {};

settingsController.content = {};

settingsController.general = function(req, res) {
    if (!checkPerms(req, 'settings:view')) return res.redirect('/');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-general';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.ticketSettings = function(req, res) {
    if (!checkPerms(req, 'settings:tickets')) return res.redirect('/settings');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-tickets';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.mailerSettings = function(req, res) {
    if (!checkPerms(req, 'settings:mailer')) return res.redirect('/settings');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-mailer';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.notificationsSettings = function(req, res) {
    if (!checkPerms(req, 'settings:notifications')) return res.redirect('/settings');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-notifications';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.tpsSettings = function(req, res) {
    if (!checkPerms(req, 'settings:tps')) return res.redirect('/settings');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-tps';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.legal = function(req, res) {
    if (!checkPerms(req, 'settings:legal')) return res.redirect('/settings');

    var content = {};
    content.title = "Settings";
    content.nav = 'settings';
    content.subnav = 'settings-legal';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

function getSettings(content, callback) {
    settingSchema.getSettings(function(err, settings) {
        if (err) return callback('Invalid Settings');

        var s = {};
        s.siteUrl = _.find(settings, function(x) { return x.name === 'gen:siteurl'});
        s.siteUrl = (s.siteUrl === undefined) ? {value: ''} : s.siteUrl;

        s.defaultTicketType = _.find(settings, function(x){return x.name === 'ticket:type:default'});
        s.defaultTicketType = (s.defaultTicketType === undefined) ? {value: ''} : s.defaultTicketType;

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
        s.mailerCheckTicketType = _.find(settings, function(x) { return x.name === 'mailer:check:ticketype' });
        s.mailerCheckTicketPriority = _.find(settings, function(x) { return x.name === 'mailer:check:ticketpriority' });
        s.mailerCheckCreateAccount = _.find(settings, function(x) { return x.name === 'mailer:check:createaccount' });
        s.mailerCheckDeleteMessage = _.find(settings, function(x) { return x.name === 'mailer:check:deletemessage' });

        s.mailerCheckEnabled = (s.mailerCheckEnabled === undefined) ? {value: false} : s.mailerCheckEnabled;
        s.mailerCheckHost = (s.mailerCheckHost === undefined) ? {value: ''} : s.mailerCheckHost;
        s.mailerCheckPort = (s.mailerCheckPort === undefined) ? {value: 143} : s.mailerCheckPort;
        s.mailerCheckUsername = (s.mailerCheckUsername === undefined) ? {value: ''} : s.mailerCheckUsername;
        s.mailerCheckPassword = (s.mailerCheckPassword === undefined) ? {value: ''} : s.mailerCheckPassword;
        s.mailerCheckTicketType = (s.mailerCheckTicketType === undefined) ? {value: ''} : s.mailerCheckTicketType;
        s.mailerCheckTicketPriority = (s.mailerCheckTicketPriority === undefined) ? {value: ''} : s.mailerCheckTicketPriority;
        s.mailerCheckCreateAccount = (s.mailerCheckCreateAccount === undefined) ? {value: false} : s.mailerCheckCreateAccount;
        s.mailerCheckDeleteMessage = (s.mailerCheckDeleteMessage === undefined) ? {value: true} : s.mailerCheckDeleteMessage;

        s.showTour = _.find(settings, function(x) { return x.name === 'showTour:enable' });
        s.showTour = (s.showTour === undefined) ? {value: true} : s.showTour;

        s.showOverdueTickets = _.find(settings, function(x) { return x.name === 'showOverdueTickets:enable' });
        s.showOverdueTickets = (s.showOverdueTickets === undefined) ? {value: true} : s.showOverdueTickets;

        s.tpsEnabled = _.find(settings, function(x) { return x.name === 'tps:enable' });
        s.tpsEnabled = (s.tpsEnabled === undefined) ? {value: false} : s.tpsEnabled;

        s.tpsUsername = _.find(settings, function(x) { return x.name === 'tps:username'});
        s.tpsUsername = (s.tpsUsername === undefined) ? { value: ''} : s.tpsUsername;

        s.tpsApiKey = _.find(settings, function(x) { return x.name === 'tps:apikey'});
        s.tpsApiKey = (s.tpsApiKey === undefined) ? { value: ''} : s.tpsApiKey;

        s.allowPublicTickets = _.find(settings, function(x) { return x.name === 'allowPublicTickets:enable' });
        s.allowPublicTickets = (s.allowPublicTickets === undefined) ? {value: false} : s.allowPublicTickets;

        s.allowUserRegistration = _.find(settings, function(x) { return x.name === 'allowUserRegistration:enable' });
        s.allowUserRegistration = (s.allowUserRegistration === undefined) ? {value: false} : s.allowUserRegistration;

        s.privacyPolicy = _.find(settings, function(x){return x.name === 'legal:privacypolicy'});
        s.privacyPolicy = (s.privacyPolicy === undefined) ? {value: ''} : s.privacyPolicy;
        s.privacyPolicy.value = jsStringEscape(s.privacyPolicy.value);

        content.data.settings = s;

        async.parallel([
            function(done) {
                ticketTypeSchema.getTypes(function(err, types) {
                    if (err) return done(err);

                    content.data.ticketTypes = _.sortBy(types, function(o){ return o.name; });
                    _.each(content.data.ticketTypes, function(type) {
                        type.priorities = _.sortBy(type.priorities, ['migrationNum', 'name']);
                    });

                    return done();
                });
            },
            function(done) {
                var ticketPrioritySchema = require('../models/ticketpriority');
                ticketPrioritySchema.getPriorities(function(err, priorities) {
                    if (err) return done(err);

                    content.data.priorities = _.sortBy(priorities, ['migrationNum', 'name']);

                    return done();
                });
            },
            function(done) {
                var tagSchema = require('../models/tag');
                tagSchema.getTagCount(function(err, count) {
                    if (err) return done(err);

                    content.data.tags = {
                        count: count
                    };

                    return done();
                });
            }
        ], function(err) {
            if (err) return callback(err);

            return callback();
        });
    });
}

settingsController.logs = function(req, res) {
    if (!checkPerms(req, 'settings:logs')) return res.redirect('/settings');

    var content = {};
    content.title = "Server Logs";
    content.nav = 'settings';
    content.subnav = 'settings-logs';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var fs = require('fs'),
        path = require('path'),
        AnsiUp = require('ansi_up'),
        ansi_up = new AnsiUp.default,
        file = path.join(__dirname, '../../logs/output.log');

    fs.readFile(file, 'utf-8', function(err, data) {
        if (err)  {
            content.data.logFileContent = err;
            return res.render('logs', content);
        }

        content.data.logFileContent = data.toString().trim();
        content.data.logFileContent = ansi_up.ansi_to_html(content.data.logFileContent);

        return res.render('logs', content);
    });
};

function checkPerms(req, role) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, role)) {
        req.flash('message', 'Permission Denied.');

        return false;
    }

    return true;
}

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = settingsController;