"use strict";

var app,
    middleware = {};

middleware.redirectToDashboardIfLoggedIn = function(req, res, next) {
    if (req.user) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

middleware.redirectToLogin = function(req, res, next) {
    if (!req.user) {
        res.redirect('/');
    } else {
        next();
    }
};

module.exports = function(server) {
    app = server;

    return middleware;
}