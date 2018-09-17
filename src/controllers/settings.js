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
var jsStringEscape      = require('js-string-escape');
var settingSchema       = require('../models/setting');
var ticketTypeSchema    = require('../models/tickettype');
var permissions         = require('../permissions');

var settingsController = {};

settingsController.content = {};

function initViewContant(view, req) {
    var content = {};
    content.title = 'Settings';
    content.nav = 'settings';
    content.subnav = 'settings-' + view;

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    return content;
}

function checkPerms(req, role) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, role)) {
        req.flash('message', 'Permission Denied.');

        return false;
    }

    return true;
}

function handleError(res, err) {
    if (err)
        return res.render('error', {layout: false, error: err, message: err.message});
}

function parseSetting(settings, name, defaultValue) {
    var s = _.find(settings, function(x) { return x.name === name; });
    s = _.isUndefined(s) ? {value: defaultValue} : s;

    return s;
}

function getSettings(content, callback) {
    settingSchema.getSettings(function(err, settings) {
        if (err) return callback('Invalid Settings');

        var s = {};

        s.siteUrl = parseSetting(settings, 'gen:siteurl', '');

        s.defaultTicketType = parseSetting(settings, 'ticket:type:default', '');

        s.mailerEnabled = parseSetting(settings, 'mailer:enable', false);
        s.mailerHost = parseSetting(settings, 'mailer:host', '');
        s.mailerSSL = parseSetting(settings, 'mailer:ssl', false);
        s.mailerPort = parseSetting(settings, 'mailer:port', 25);
        s.mailerUsername = parseSetting(settings, 'mailer:username', '');
        s.mailerPassword = parseSetting(settings, 'mailer:password', '');
        s.mailerFrom = parseSetting(settings, 'mailer:from', '');

        s.mailerCheckEnabled = parseSetting(settings, 'mailer:check:enable', false);
        s.mailerCheckHost = parseSetting(settings, 'mailer:check:host', '');
        s.mailerCheckPort = parseSetting(settings, 'mailer:check:port', 143);
        s.mailerCheckUsername = parseSetting(settings, 'mailer:check:username', '');
        s.mailerCheckPassword = parseSetting(settings, 'mailer:check:password', '');
        s.mailerCheckTicketType = parseSetting(settings, 'mailer:check:ticketype', '');
        s.mailerCheckTicketPriority = parseSetting(settings, 'mailer:check:ticketpriority', '');
        s.mailerCheckCreateAccount = parseSetting(settings, 'mailer:check:createaccount', false);
        s.mailerCheckDeleteMessage = parseSetting(settings, 'mailer:check:deletemessage', true);

        s.showTour = parseSetting(settings, 'showTour:enable', false);
        s.showOverdueTickets = parseSetting(settings, 'showOverdueTickets:enable', true);

        s.tpsEnabled = parseSetting(settings, 'tps:enable', false);
        s.tpsUsername = parseSetting(settings, 'tps:username', '');
        s.tpsApiKey = parseSetting(settings, 'tps:apikey', '');

        s.allowPublicTickets = parseSetting(settings, 'allowPublicTickets:enable', false);
        s.allowUserRegistration = parseSetting(settings, 'allowUserRegistration:enable', false);

        s.privacyPolicy = parseSetting(settings, 'legal:privacypolicy', '');
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

settingsController.general = function(req, res) {
    if (!checkPerms(req, 'settings:view')) return res.redirect('/');

    var content = initViewContant('general', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.ticketSettings = function(req, res) {
    if (!checkPerms(req, 'settings:tickets')) return res.redirect('/settings');

    var content = initViewContant('tickets', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.mailerSettings = function(req, res) {
    if (!checkPerms(req, 'settings:mailer')) return res.redirect('/settings');

    var content = initViewContant('mailer', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.notificationsSettings = function(req, res) {
    if (!checkPerms(req, 'settings:notifications')) return res.redirect('/settings');

    var content = initViewContant('notifications', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.tpsSettings = function(req, res) {
    if (!checkPerms(req, 'settings:tps')) return res.redirect('/settings');

    var content = initViewContant('tps', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.legal = function(req, res) {
    if (!checkPerms(req, 'settings:legal')) return res.redirect('/settings');

    var content = initViewContant('legal', req);

    getSettings(content, function(err) {
        if (err) return handleError(res, err);

        return res.render('settings', content);
    });
};

settingsController.logs = function(req, res) {
    if (!checkPerms(req, 'settings:logs')) return res.redirect('/settings');

    var content = initViewContant('logs', req);

    var fs = require('fs'),
        path = require('path'),
        AnsiUp = require('ansi_up'),
        ansiUp = new AnsiUp.default,
        file = path.join(__dirname, '../../logs/output.log');

    fs.readFile(file, 'utf-8', function(err, data) {
        if (err)  {
            content.data.logFileContent = err;
            return res.render('logs', content);
        }

        content.data.logFileContent = data.toString().trim();
        content.data.logFileContent = ansiUp.ansi_to_html(content.data.logFileContent);

        return res.render('logs', content);
    });
};

module.exports = settingsController;