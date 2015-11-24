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
    mongoose    = require('mongoose'),
    passport = require('passport');

function mainRoutes(router, middleware, controllers) {
    router.get('/', middleware.redirectToDashboardIfLoggedIn, middleware.cache(5*60), controllers.main.index);
    router.get('/dashboard', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.dashboard);

    router.get('/login', middleware.redirectToLogin, middleware.cache(5*60), middleware.redirectToDashboardIfLoggedIn);
    router.post('/login', controllers.main.loginPost);
    router.get('/logout', controllers.main.logout);
    router.post('/forgotpass', controllers.main.forgotPass);
    router.get('/resetpassword/:hash', controllers.main.resetPass);

    //Tickets
    router.get('/tickets', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/filter', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.filter, controllers.tickets.processor);
    router.get('/tickets/active', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/active/page/:page', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive, controllers.tickets.processor);
    router.get('/tickets/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.create);
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
    router.get('/tickets/print/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.print);
    router.get('/tickets/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.single);
    router.post('/tickets/postcomment', middleware.redirectToLogin, controllers.tickets.postcomment);
    router.post('/tickets/uploadattachment', middleware.redirectToLogin, controllers.tickets.uploadAttachment);

    //Messages
    router.get('/messages', middleware.redirectToLogin, middleware.loadCommonData, function(req, res){ res.redirect('/messages/inbox');});
    router.get('/messages/inbox', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.get);
    router.get('/messages/sentitems', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getSentItems);
    router.get('/messages/trash', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getTrashItems);
    router.get('/messages/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getById);

    //Calendar
    router.get('/calendar', middleware.redirectToLogin, middleware.loadCommonData, function(req, res){ res.redirect('/dashboard');});

    //Servers
    router.get('/servers', middleware.redirectToLogin, middleware.loadCommonData, controllers.servers.get);

    //Accounts
    router.get('/profile', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.profile);
    router.get('/accounts', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.get);
    router.get('/accounts/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.createAccount);
    router.post('/accounts/create', middleware.redirectToLogin, controllers.accounts.postCreate);
    router.post('/accounts/edit', middleware.redirectToLogin, controllers.accounts.postEdit);
    router.get('/accounts/edit', middleware.redirectToLogin, function(req, res) { res.redirect('/accounts');});
    router.get('/accounts/:username', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.editAccount);
    router.post('/accounts/uploadimage', middleware.redirectToLogin, controllers.accounts.uploadImage);

    //Groups
    router.get('/groups', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.get);
    router.get('/groups/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.getCreate);
    router.get('/groups/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.edit);

    //Reports
    router.get('/reports', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.get);
    router.get('/reports/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.get);
    router.get('/reports/active', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.get);
    router.get('/reports/inactive', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.get);
    router.get('/reports/completed', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.get);

    //Invoices
    router.get('/invoices', middleware.redirectToLogin, middleware.loadCommonData, function(req, res) { res.redirect('/dashboard');});

    //Notices
    router.get('/notices', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.get);
    router.get('/notices/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.create);
    router.get('/notices/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.edit);

    //API
    router.get('/api', controllers.api.index);
    router.post('/api/v1/login', controllers.api.login);
    router.get('/api/v1/logout', middleware.api, controllers.api.logout);
    router.post('/api/v1/devices/settoken', middleware.api, controllers.api.devices.setDeviceToken);
    router.get('/api/v1/devices/testiOS', middleware.api, controllers.api.devices.testApn);
    router.get('/api/v1/tickets', middleware.api, controllers.api.tickets.get);
    router.post('/api/v1/tickets/create', middleware.api, controllers.api.tickets.create);
    router.get('/api/v1/tickets/types', middleware.api, controllers.api.tickets.getTypes);
    router.get('/api/v1/tickets/count/year/:year', middleware.api, controllers.api.tickets.getYearData);
    router.get('/api/v1/tickets/count/month/:month', middleware.api, controllers.api.tickets.getMonthData);
    router.get('/api/v1/tickets/count/topgroups', middleware.api, controllers.api.tickets.getTopTicketGroups);
    router.get('/api/v1/tickets/count/topgroups/:top', middleware.api, controllers.api.tickets.getTopTicketGroups);
    router.get('/api/v1/tickets/:uid/api/v1/tickets/:uid', middleware.api, controllers.api.tickets.single);
    router.put('/api/v1/tickets/:id', middleware.api, controllers.api.tickets.update);
    router.delete('/api/v1/tickets/:id', middleware.api, controllers.api.tickets.delete);
    router.put('/api/v1/tickets/:id/subscribe', middleware.api, controllers.api.tickets.subscribe);
    router.post('/api/v1/tickets/addcomment', middleware.api, controllers.api.tickets.postComment);
    router.delete('/api/v1/tickets/:tid/attachments/remove/:aid', middleware.api, controllers.api.tickets.removeAttachment);
    router.get('/api/v1/groups', middleware.api, middleware.cache(5*60), controllers.api.groups.get);
    router.post('/api/v1/groups/create', middleware.api, controllers.api.groups.create);
    router.delete('/api/v1/groups/:id', middleware.api, controllers.api.groups.deleteGroup);
    router.put('/api/v1/groups/:id', middleware.api, controllers.api.groups.updateGroup);
    router.post('/api/v1/users', controllers.api.users.insert);
    router.get('/api/v1/users/notificationCount', middleware.api, controllers.api.users.notificationCount);
    router.get('/api/v1/users/:username', middleware.api, controllers.api.users.single);
    router.put('/api/v1/users/:username', middleware.api, controllers.api.users.update);
    router.put('/api/v1/users/:username/updatepreferences', middleware.api, controllers.api.users.updatePreferences);
    router.delete('/api/v1/users/:username', middleware.api, controllers.api.users.deleteUser);
    router.post('/api/v1/users/:id/generateapikey', middleware.api, controllers.api.users.generateApiKey);
    router.post('/api/v1/users/:id/removeapikey', middleware.api, controllers.api.users.removeApiKey);
    router.get('/api/v1/roles', middleware.api, controllers.api.roles.get);
    router.get('/api/v1/messages', middleware.api, controllers.api.messages.get);
    router.post('/api/v1/messages/send', middleware.api, controllers.api.messages.send);
    router.post('/api/v1/notices/create', middleware.api, controllers.api.notices.create);
    router.get('/api/v1/notices/clearactive', middleware.api, controllers.api.notices.clearActive);
    router.put('/api/v1/notices/:id', middleware.api, controllers.api.notices.updateNotice);
    router.delete('/api/v1/notices/:id', middleware.api, controllers.api.notices.deleteNotice);

    //router.get('/debug/sendmail', controllers.debug.sendmail);
    //router.get('/api/v1/import', middleware.api, controllers.api.import);
}

module.exports = function(app, middleware) {
    //Docs
    app.use('/docs', middleware.redirectToLogin, express.static(path.join(__dirname, '../../', 'docs')));
    app.use('/apidocs', middleware.redirectToLogin, express.static(path.join(__dirname, '../../', 'apidocs')));

    mainRoutes(router, middleware, controllers);
    app.use('/', router);

    app.use(handle404);
    app.use(handleErrors);
};

function handleErrors(err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    //req.flash('errorMessage', err.message);

    if (status == 404) {
        winston.debug(err.message);
        res.render('404', {layout: false});
        return;
    }

    if (status == 503) {
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

function handle404(req, res, next) {
    var err = new Error('Not Found: ' + req.protocol + '://' + req.hostname + req.path);
    err.status = 404;

    next(err);
}
