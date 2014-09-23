"use strict";

var express = require('express'),
    router = express.Router(),
    controllers = require('../controllers/index.js');

var passport = require('passport');


function mainRoutes(router, middleware, controllers) {
    router.get('/', controllers.main.index);
    router.get('/dashboard', middleware.redirectToLogin, controllers.main.dashboard);

    router.get('/login', middleware.redirectToLogin, middleware.redirectToDashboardIfLoggedIn);
    router.post('/login', controllers.main.loginPost);
    router.get('/logout', controllers.main.logout);
};

module.exports = function(app, middleware) {
    var router = express.Router();
    mainRoutes(router, middleware, controllers);


    app.use('/', router);
};