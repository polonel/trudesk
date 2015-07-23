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
    multer      = require('multer'),
    winston     = require('winston'),
    mongoose    = require('mongoose'),
    passport = require('passport');

var profileUploads = multer({dest: path.join(__dirname, '../../', 'public/uploads/users'), fileFilter: fileFilter, rename: function(fieldname, filename) {
    return fieldname;
}});

function fileFilter (req, file, cb) {
    winston.debug(file);
    if (file.extension === 'png') {
        cb(null, true);
    }
    if (file.extension === 'exe') {
        cb(null, false);
    }
}

function mainRoutes(router, middleware, controllers) {
    router.get('/', middleware.redirectToDashboardIfLoggedIn, middleware.cache(5*60), controllers.main.index);
    router.get('/dashboard', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.dashboard);

    router.get('/login', middleware.redirectToLogin, middleware.cache(5*60), middleware.redirectToDashboardIfLoggedIn);
    router.post('/login', controllers.main.loginPost);
    router.get('/logout', controllers.main.logout);
    router.post('/forgotpass', controllers.main.forgotPass);
    router.get('/resetpassword/:hash', controllers.main.resetPass);

    //Tickets
    router.get('/tickets', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive);
    router.get('/tickets/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.create);
    router.post('/tickets/create', middleware.redirectToLogin, controllers.tickets.submitTicket);
    router.get('/tickets/new', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/open', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/pending', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/closed', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/active', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getActive);
    router.get('/tickets/assigned', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getAssigned);
    router.get('/tickets/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.single);
    router.get('/tickets/print/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.print);
    router.post('/tickets/postcomment', middleware.redirectToLogin, controllers.tickets.postcomment);
    router.post('/tickets/uploadattachment', middleware.redirectToLogin, controllers.tickets.uploadAttachment);
    //router.post('/tickets/uploadattachment', middleware.redirectToLogin, multer({dest: path.join(__dirname, '../../', 'public/uploads/tickets'), rename: function(fieldname, filename) {
    //    return fieldname + '_' + filename;
    //}, fileFilter: fileFilter}), controllers.tickets.uploadAttachment);

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
    //router.post('/accounts/uploadimage', middleware.redirectToLogin, profileUploads.single(), controllers.accounts.uploadImage);

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

    //API
    router.get('/api', controllers.api.index);
    router.post('/api/login', middleware.api, controllers.api.login);
    router.get('/api/logout', middleware.api, controllers.api.logout);
    router.post('/api/devices/settoken', middleware.api, controllers.api.devices.setDeviceToken);
    router.get('/api/devices/testiOS', middleware.api, controllers.api.devices.testApn);
    router.get('/api/tickets', middleware.api, controllers.api.tickets.get);
    router.post('/api/tickets/create', middleware.api, controllers.api.tickets.create);
    router.get('/api/tickets/types', middleware.api, controllers.api.tickets.getTypes);
    router.get('/api/tickets/count/year/:year', middleware.api, controllers.api.tickets.getYearData);
    router.get('/api/tickets/count/month/:month', middleware.api, controllers.api.tickets.getMonthData);
    router.get('/api/tickets/:uid', middleware.api, controllers.api.tickets.single);
    router.put('/api/tickets/:id', middleware.api, controllers.api.tickets.update);
    router.delete('/api/tickets/:id', middleware.api, controllers.api.tickets.delete);
    router.post('/api/tickets/addcomment', middleware.api, controllers.api.tickets.postComment);
    router.get('/api/groups', middleware.api, middleware.cache(5*60), controllers.api.groups.get);
    router.post('/api/groups/create', middleware.api, controllers.api.groups.create);
    router.delete('/api/groups/:id', middleware.api, controllers.api.groups.deleteGroup);
    router.put('/api/groups/:id', middleware.api, controllers.api.groups.updateGroup);
    router.get('/api/users', middleware.api, controllers.api.users.get);
    router.post('/api/users', controllers.api.users.insert);
    router.get('/api/users/notificationCount', middleware.api, controllers.api.users.notificationCount);
    router.get('/api/users/:username', middleware.api, controllers.api.users.single);
    router.put('/api/users/:username', middleware.api, controllers.api.users.update);
    router.delete('/api/users/:username', middleware.api, controllers.api.users.deleteUser);
    router.get('/api/roles', middleware.api, controllers.api.roles.get);
    router.get('/api/messages', middleware.api, controllers.api.messages.get);
    router.post('/api/messages/send', middleware.api, controllers.api.messages.send);

    router.get('/api/import', middleware.api, controllers.api.import);
}

module.exports = function(app, middleware) {
    mainRoutes(router, middleware, controllers);

    app.use('/', router);

    app.use(handle404);
    app.use(handleErrors);
};

function handleErrors(err, req, res, next) {
    winston.warn(err.stack);
    var status = err.status || 500;
    res.status(status);
    //req.flash('errorMessage', err.message);

    if (status == 404) {
        res.render('404', {layout: false});
        return;
    }

    if (status == 503) {
        res.render('503', {layout: false});
        return;
    }

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
