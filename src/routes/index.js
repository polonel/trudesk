/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
=========================================================================
    Created:    12/25/2014
    Author:     Chris Brame
 */

var express     = require('express'),
    router      = express.Router(),
    controllers = require('../controllers/index.js'),
    path        = require('path'),
    multer      = require('multer');
    winston     = require('winston');

var passport = require('passport');

function mainRoutes(router, middleware, controllers) {
    router.get('/', middleware.redirectToDashboardIfLoggedIn, controllers.main.index);
    router.get('/dashboard', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.dashboard);

    router.get('/login', middleware.redirectToLogin, middleware.redirectToDashboardIfLoggedIn);
    router.post('/login', controllers.main.loginPost);
    router.get('/logout', controllers.main.logout);

    //Tickets
    router.get('/tickets', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.get);
    router.get('/tickets/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.create);
    router.post('/tickets/create', middleware.redirectToLogin, controllers.tickets.submitTicket);
    router.get('/tickets/new', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/open', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/pending', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/closed', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.getByStatus);
    router.get('/tickets/edit/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.editTicket);
    router.get('/tickets/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.single);
    router.post('/tickets/postcomment', middleware.redirectToLogin, controllers.tickets.postcomment);

    //Messages
    router.get('/messages', middleware.redirectToLogin, middleware.loadCommonData, function(req, res){ res.redirect('/messages/inbox');});
    router.get('/messages/inbox', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.get);
    router.get('/messages/sentitems', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getSentItems);
    router.get('/messages/trash', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getTrashItems);

    router.get('/messages/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.getById);

    //Servers
    router.get('/servers', middleware.redirectToLogin, middleware.loadCommonData, controllers.servers.get);

    //Accounts
    router.get('/accounts', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.get);
    router.get('/accounts/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.createAccount);
    router.post('/accounts/create', middleware.redirectToLogin, controllers.accounts.postCreate);
    router.post('/accounts/edit', middleware.redirectToLogin, controllers.accounts.postEdit);
    router.get('/accounts/edit', middleware.redirectToLogin, function(req, res) { res.redirect('/accounts');});
    router.get('/accounts/:username', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.editAccount);
    router.post('/accounts/uploadimage', middleware.redirectToLogin, multer({dest: path.join(__dirname, '../../', 'public/uploads/users'), rename: function(fieldname, filename) {
        return fieldname;
    }}), controllers.accounts.uploadImage);

    //Groups
    router.get('/groups', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.get);

    //API
    router.get('/api', controllers.api.index);
    router.get('/api/tickets', middleware.api, controllers.api.tickets.get);
    router.get('/api/tickets/:uid', middleware.api, controllers.api.tickets.single);
    router.get('/api/users', middleware.api, controllers.api.users.get);
    router.post('/api/users', controllers.api.users.insert);
    router.get('/api/users/:username', middleware.api, controllers.api.users.single);
    router.get('/api/roles', middleware.api, controllers.api.roles.get);
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

    res.render('error', {
        message: err.message,
        error: err,
        layout: false
    });
}

function handle404(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
}
