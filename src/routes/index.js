/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

var express     = require('express'),
    router      = express.Router(),
    controllers = require('../controllers/index.js'),
    path        = require('path'),
    winston     = require('winston'),
    packagejson = require('../../package.json');

function mainRoutes(router, middleware, controllers) {
    router.get('/', middleware.redirectToDashboardIfLoggedIn, controllers.main.index);
    router.get('/healthz', function(req, res) { return res.status(200).send('OK'); });
    router.get('/version', function(req, res) { return res.json({version: packagejson.version }); });
    router.get('/install', function(req, res){ return res.redirect('/'); });
    router.get('/dashboard', middleware.redirectToLogin, middleware.redirectIfUser, middleware.loadCommonData, controllers.main.dashboard);

    router.get('/login', function(req, res) { return res.redirect('/');});
    router.get('/logint', controllers.main.index);
    router.post('/login', controllers.main.loginPost);
    router.get('/l2auth', controllers.main.l2authget);
    router.post('/l2auth', controllers.main.l2AuthPost);
    router.get('/logout', controllers.main.logout);
    router.post('/forgotpass', controllers.main.forgotPass);
    router.get('/resetpassword/:hash', controllers.main.resetPass);
    router.post('/forgotl2auth', controllers.main.forgotL2Auth);
    router.get('/resetl2auth/:hash', controllers.main.resetl2auth);

    router.get('/about', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.about);

    router.get('/captcha', function(req, res) {
        var svgCaptcha = require('svg-captcha');
        var captcha = svgCaptcha.create();
        req.session.captcha = captcha.text;
        res.set('Content-Type', 'image/svg+xml');
        res.send(captcha.data);
    });

    //Public
    router.get('/newissue', controllers.tickets.pubNewIssue);
    router.get('/register', controllers.accounts.signup);
    router.get('/signup', controllers.accounts.signup);

    router.get('/logoimage', function(req, res) {
        var s = require('../models/setting');
        var _ = require('lodash');
        s.getSettingByName('gen:customlogo', function(err, hasCustomLogo) {
            if (!err && hasCustomLogo && hasCustomLogo.value)
                s.getSettingByName('gen:customlogofilename', function(err, logoFilename) {
                    if (!err && logoFilename && !_.isUndefined(logoFilename))
                        return res.send('/assets/topLogo.png');
                    else
                        return res.send('/img/defaultLogoLight.png');
                });
            else
                return res.send('/img/defaultLogoLight.png');
        });
    });

    //Tickets
    router.get('/tickets', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/filter', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.filter, controllers.tickets.processor);
    router.get('/tickets/active', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/active/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/new', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/new/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/open', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/open/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/pending', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/pending/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/closed', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/closed/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus, controllers.tickets.processor);
    router.get('/tickets/assigned', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getAssigned, controllers.tickets.processor);
    router.get('/tickets/assigned/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getAssigned, controllers.tickets.processor);
    router.get('/tickets/unassigned', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getUnassigned, controllers.tickets.processor);
    router.get('/tickets/unassigned/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getUnassigned, controllers.tickets.processor);
    router.get('/tickets/print/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.print);
    router.get('/tickets/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.single);
    // router.post('/tickets/postcomment', middleware.redirectToLogin, controllers.tickets.postcomment);
    router.post('/tickets/uploadattachment', middleware.redirectToLogin, controllers.tickets.uploadAttachment);

    //Messages
    router.get('/messages', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.get);
    router.get('/messages/startconversation', middleware.redirectToLogin, middleware.loadCommonData, function(req, res, next){ req.showNewConvo = true; next();}, controllers.messages.get);
    router.get('/messages/:convoid', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getConversation);

    //Accounts
    router.get('/profile', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.profile);
    router.get('/accounts', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.get);
    router.post('/accounts/uploadimage', middleware.redirectToLogin, controllers.accounts.uploadImage);
    router.get('/accounts/import', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.importPage);
    router.post('/accounts/import/csv/upload', middleware.redirectToLogin, controllers.accounts.uploadCSV);
    router.post('/accounts/import/json/upload', middleware.redirectToLogin, controllers.accounts.uploadJSON);
    router.post('/accounts/import/ldap/bind', middleware.redirectToLogin, controllers.accounts.bindLdap);

    //Groups
    router.get('/groups', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.get);
    router.get('/groups/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.getCreate);
    router.get('/groups/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.edit);

    //Reports
    router.get('/reports', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.overview);
    router.get('/reports/overview', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.overview);
    router.get('/reports/generate', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.generate);
    router.get('/reports/breakdown/group', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.breakdownGroup);
    router.get('/reports/breakdown/user', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.breakdownUser);

    //Notices
    router.get('/notices', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.get);
    router.get('/notices/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.create);
    router.get('/notices/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.edit);

    router.get('/settings', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.general);
    router.get('/settings/general', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.general);
    router.get('/settings/appearance', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.appearance);
    router.post('/settings/general/uploadlogo', middleware.redirectToLogin, controllers.main.uploadLogo);
    router.post('/settings/general/uploadpagelogo', middleware.redirectToLogin, controllers.main.uploadPageLogo);
    router.post('/settings/general/uploadfavicon', middleware.redirectToLogin, controllers.main.uploadFavicon);
    router.get('/settings/tickets', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.ticketSettings);
    router.get('/settings/mailer', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.mailerSettings);
    router.get('/settings/notifications', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.notificationsSettings);
    router.get('/settings/tps', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.tpsSettings);
    router.get('/settings/legal', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.legal);
    router.get('/settings/logs', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.logs);

    //Plugins
    router.get('/plugins', middleware.redirectToLogin, middleware.loadCommonData, controllers.plugins.get);

    //API
    router.get('/api', controllers.api.index);
    router.get('/api/v1/version', function(req, res) { return res.json({version: packagejson.version }); });
    router.post('/api/v1/login', controllers.api.login);
    router.get('/api/v1/login', middleware.api, controllers.api.getLoggedInUser);
    router.get('/api/v1/logout', middleware.api, controllers.api.logout);
    router.post('/api/v1/devices/settoken', middleware.api, controllers.api.devices.setDeviceToken);

    router.get('/api/v1/tickets', middleware.api, controllers.api.tickets.get);
    router.get('/api/v1/tickets/search', middleware.api, controllers.api.tickets.search);
    router.post('/api/v1/tickets/create', middleware.api, controllers.api.tickets.create);
    router.get('/api/v1/tickets/type/:id', middleware.api, controllers.api.tickets.getType);
    router.post('/api/v1/tickets/type/:id/removepriority', middleware.api, controllers.api.tickets.typeRemovePriority);
    router.post('/api/v1/tickets/type/:id/addpriority', middleware.api, controllers.api.tickets.typeAddPriority);
    router.get('/api/v1/tickets/types', middleware.api, controllers.api.tickets.getTypes);
    router.post('/api/v1/tickets/types/create', middleware.api, controllers.api.tickets.createType);
    router.put('/api/v1/tickets/types/:id', middleware.api, controllers.api.tickets.updateType);
    router.delete('/api/v1/tickets/types/:id', middleware.api, controllers.api.tickets.deleteType);
    router.post('/api/v1/tickets/priority/create', middleware.api, controllers.api.tickets.createPriority);
    router.post('/api/v1/tickets/priority/:id/delete', middleware.api, controllers.api.tickets.deletePriority);
    router.get('/api/v1/tickets/priorities', middleware.api, controllers.api.tickets.getPriorities);
    router.put('/api/v1/tickets/priority/:id', middleware.api, controllers.api.tickets.updatePriority);

    router.get('/api/v1/tickets/overdue', middleware.api, controllers.api.tickets.getOverdue);
    router.post('/api/v1/tickets/addcomment', middleware.api, controllers.api.tickets.postComment);
    router.post('/api/v1/tickets/addnote', middleware.api, controllers.api.tickets.postInternalNote);
    router.get('/api/v1/tickets/tags', middleware.api, controllers.api.tickets.getTags);
    router.get('/api/v1/tickets/count/tags', middleware.api, controllers.api.tickets.getTagCount);
    router.get('/api/v1/tickets/count/tags/:timespan', middleware.api, controllers.api.tickets.getTagCount);
    router.get('/api/v1/tickets/count/days', middleware.api, controllers.api.tickets.getTicketStats);
    router.get('/api/v1/tickets/count/days/:timespan', middleware.api, controllers.api.tickets.getTicketStats);
    router.get('/api/v1/tickets/count/topgroups', middleware.api, controllers.api.tickets.getTopTicketGroups);
    router.get('/api/v1/tickets/count/topgroups/:top', middleware.api, controllers.api.tickets.getTopTicketGroups);
    router.get('/api/v1/tickets/count/topgroups/:timespan/:top', middleware.api, controllers.api.tickets.getTopTicketGroups);
    router.get('/api/v1/tickets/stats', middleware.api, controllers.api.tickets.getTicketStats);
    router.get('/api/v1/tickets/stats/group/:group', middleware.api, controllers.api.tickets.getTicketStatsForGroup);
    router.get('/api/v1/tickets/stats/user/:user', middleware.api, controllers.api.tickets.getTicketStatsForUser);
    router.get('/api/v1/tickets/stats/:timespan', middleware.api, controllers.api.tickets.getTicketStats);
    router.get('/api/v1/tickets/:uid', middleware.api, controllers.api.tickets.single);
    router.put('/api/v1/tickets/:id', middleware.api, controllers.api.tickets.update);
    router.delete('/api/v1/tickets/:id', middleware.api, controllers.api.tickets.delete);
    router.put('/api/v1/tickets/:id/subscribe', middleware.api, controllers.api.tickets.subscribe);
    router.delete('/api/v1/tickets/:tid/attachments/remove/:aid', middleware.api, controllers.api.tickets.removeAttachment);

    router.post('/api/v1/tags/create', middleware.api, controllers.api.tags.createTag);
    router.get('/api/v1/tags/limit', middleware.api, controllers.api.tags.getTagsWithLimit);
    router.put('/api/v1/tags/:id', middleware.api, controllers.api.tags.updateTag);
    router.delete('/api/v1/tags/:id', middleware.api, controllers.api.tags.deleteTag);

    router.get('/api/v1/groups', middleware.api, controllers.api.groups.get);
    router.get('/api/v1/groups/all', middleware.api, controllers.api.groups.getAll);
    router.post('/api/v1/groups/create', middleware.api, controllers.api.groups.create);
    router.get('/api/v1/groups/:id', middleware.api, controllers.api.groups.getSingleGroup);
    router.delete('/api/v1/groups/:id', middleware.api, controllers.api.groups.deleteGroup);
    router.put('/api/v1/groups/:id', middleware.api, controllers.api.groups.updateGroup);

    router.get('/api/v1/users', middleware.api, controllers.api.users.getWithLimit);
    router.post('/api/v1/users/create', middleware.api, controllers.api.users.create);
    router.get('/api/v1/users/notificationCount', middleware.api, controllers.api.users.notificationCount);
    router.get('/api/v1/users/getassignees', middleware.api, controllers.api.users.getAssingees);
    router.get('/api/v1/users/:username', middleware.api, controllers.api.users.single);
    router.put('/api/v1/users/:username', middleware.api, controllers.api.users.update);
    router.post('/api/v1/users/:username/uploadprofilepic', controllers.api.users.uploadProfilePic);
    router.put('/api/v1/users/:username/updatepreferences', middleware.api, controllers.api.users.updatePreferences);
    router.get('/api/v1/users/:username/enable', middleware.api, controllers.api.users.enableUser);
    router.delete('/api/v1/users/:username', middleware.api, controllers.api.users.deleteUser);
    router.post('/api/v1/users/:id/generateapikey', middleware.api, controllers.api.users.generateApiKey);
    router.post('/api/v1/users/:id/removeapikey', middleware.api, controllers.api.users.removeApiKey);
    router.post('/api/v1/users/:id/generatel2auth', middleware.api, controllers.api.users.generateL2Auth);
    router.post('/api/v1/users/:id/removel2auth', middleware.api, controllers.api.users.removeL2Auth);

    router.get('/api/v1/roles', middleware.api, controllers.api.roles.get);

    router.get('/api/v1/messages', middleware.api, controllers.api.messages.get);
    router.post('/api/v1/messages/conversation/start', middleware.api, controllers.api.messages.startConversation);
    router.get('/api/v1/messages/conversation/:id', middleware.api, controllers.api.messages.getMessagesForConversation);
    router.delete('/api/v1/messages/conversation/:id', middleware.api, controllers.api.messages.deleteConversation);
    router.get('/api/v1/messages/conversations', middleware.api, controllers.api.messages.getConversations);
    router.get('/api/v1/messages/conversations/recent', middleware.api, controllers.api.messages.getRecentConversations);
    router.post('/api/v1/messages/send', middleware.api, controllers.api.messages.send);

    router.post('/api/v1/notices/create', middleware.api, controllers.api.notices.create);
    router.get('/api/v1/notices/clearactive', middleware.api, controllers.api.notices.clearActive);
    router.put('/api/v1/notices/:id', middleware.api, controllers.api.notices.updateNotice);
    router.delete('/api/v1/notices/:id', middleware.api, controllers.api.notices.deleteNotice);

    //Reports Generator
    router.post('/api/v1/reports/generate/tickets_by_group', middleware.api, controllers.api.reports.generate.ticketsByGroup);
    router.post('/api/v1/reports/generate/tickets_by_status', middleware.api, controllers.api.reports.generate.ticketsByStatus);
    router.post('/api/v1/reports/generate/tickets_by_priority', middleware.api, controllers.api.reports.generate.ticketsByPriority);
    router.post('/api/v1/reports/generate/tickets_by_tags', middleware.api, controllers.api.reports.generate.ticketsByTags);
    router.post('/api/v1/reports/generate/tickets_by_type', middleware.api, controllers.api.reports.generate.ticketsByType);
    router.post('/api/v1/reports/generate/tickets_by_user', middleware.api, controllers.api.reports.generate.ticketsByUser);


    router.put('/api/v1/settings', middleware.api, controllers.api.settings.updateSetting);
    router.post('/api/v1/settings/testmailer', middleware.api, controllers.api.settings.testMailer);
    router.get('/api/v1/settings/buildsass', middleware.api, controllers.api.settings.buildsass);

    router.get('/api/v1/plugins/list/installed', middleware.api, function(req, res) { return res.json({success: true, loadedPlugins: global.plugins}); });
    router.get('/api/v1/plugins/install/:packageid', middleware.api, middleware.isAdmin, controllers.api.plugins.installPlugin);
    router.delete('/api/v1/plugins/remove/:packageid', middleware.api, middleware.isAdmin, controllers.api.plugins.removePlugin);

    router.post('/api/v1/public/users/checkemail', middleware.checkCaptcha, middleware.checkOrigin, controllers.api.users.checkEmail);
    router.post('/api/v1/public/tickets/create', middleware.checkCaptcha, middleware.checkOrigin, controllers.api.tickets.createPublicTicket);
    router.post('/api/v1/public/account/create', middleware.checkCaptcha, middleware.checkOrigin, controllers.api.users.createPublicAccount);


    router.get('/api/v1/admin/restart', middleware.api, middleware.isAdmin, function(req, res) {
        if (req.user.role === 'admin') {
            var pm2 = require('pm2');
            pm2.connect(function(err) {
                if (err) {
                    winston.error(err);
                    res.status(400).send(err);
                    return;
                }
                pm2.restart('trudesk', function(err) {
                    if (err) {
                        res.status(400).send(err);
                        return winston.error(err);
                    }

                    pm2.disconnect();
                    res.json({success: true});
                });
            });
        } else
            return res.status(401).json({success: false, error: 'Unauthorized!'});
    });

    if (global.env === 'development') {
        router.get('/debug/populatedb', controllers.debug.populatedatabase);

        router.get('/debug/sendmail', controllers.debug.sendmail);
        router.get('/debug/mailcheck/refetch', function(req, res) {
            var mailCheck = require('../mailer/mailCheck');
            mailCheck.refetch();
            res.send('OK');
        });

        router.get('/debug/cache/refresh', function (req, res) {
            var _ = require('lodash');

            var forkProcess = _.find(global.forks, {name: 'cache'});
            forkProcess.fork.send({name: 'cache:refresh'});

            res.send('OK');
        });

        router.get('/debug/restart', function (req, res) {
            var pm2 = require('pm2');
            pm2.connect(function(err) {
                if (err) {
                    winston.error(err);
                    res.status(400).send(err);
                    return;
                }
                pm2.restart('trudesk', function(err) {
                    if (err) {
                        res.status(400).send(err);
                        return winston.error(err);
                    }

                    pm2.disconnect();
                    res.send('OK');
                });
            });
        });
    }
}

module.exports = function(app, middleware) {
    mainRoutes(router, middleware, controllers);
    app.use('/', router);

    //Load Plugin routes
    var dive = require('dive');
    var fs = require('fs');
    var pluginDir = path.join(__dirname, '../../plugins');
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
    dive(pluginDir, {directories: true, files: false, recursive: false}, function(err, dir) {
        if (err) throw err;
        var pluginRoutes = require(path.join(dir, '/routes'));
        if (pluginRoutes)
            pluginRoutes(router, middleware);
        else
            winston.warn('Unable to load plugin: ' + pluginDir);
    });

    app.use(handle404);
    app.use(handleErrors);
};

function handleErrors(err, req, res) {
    var status = err.status || 500;
    res.status(err.status);

    if (status === 404) {
        res.render('404', {layout: false});
        return;
    }

    if (status === 503) {
        res.render('503', {layout: false});
        return;
    }

    winston.warn(err.stack);

    res.render('error', {
        message: err.message,
        error: err,
        layout: false
    });

}

function handle404(req, res) {
    return res.status(404).render('404', {layout: false});
}
