"use strict";

var express = require('express'),
    router = express.Router(),
    controllers = require('../controllers/index.js'),
    path = require('path'),
    winston = require('winston');

var passport = require('passport');


function mainRoutes(router, middleware, controllers) {
    router.get('/', middleware.redirectToDashboardIfLoggedIn, controllers.main.index);
    router.get('/dashboard', middleware.redirectToLogin, controllers.main.dashboard);

    router.get('/login', middleware.redirectToLogin, middleware.redirectToDashboardIfLoggedIn);
    router.post('/login', controllers.main.loginPost);
    router.get('/logout', controllers.main.logout);

    //Tickets
    router.get('/tickets', middleware.redirectToLogin, controllers.tickets.get);

    //Messages
    router.get('/messages', middleware.redirectToLogin, function(req, res){ res.redirect('/messages/inbox');});
    router.get('/messages/inbox', middleware.redirectToLogin, controllers.messages.get);

    router.get('/messages/:id', middleware.redirectToLogin, controllers.messages.getById);

    //Servers
    router.get('/servers', middleware.redirectToLogin, controllers.servers.get);

    //API
    router.get('/api', controllers.api.index);
    router.get('/api/users', middleware.api, controllers.api.users.get);
    router.post('/api/users', controllers.api.users.insert);
}

//function staticRoutes(app, middleware) {
//    app.use(express.static(path.join(__dirname, '../../public')));
//}

module.exports = function(app, middleware) {
    var router = express.Router();

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
