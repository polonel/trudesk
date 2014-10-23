"use strict";

var _ = require('lodash');
var db = require('../database');

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

//API
middleware.api = function(req, res, next) {
    if (_.isUndefined(db)) {
      res.send('Invalid DB - Middleware.Api()');
    }
    if (_.isUndefined(req.db)) {
      req.db = db;
    }

    next();

}








module.exports = function(server, mongodb) {
    app = server;

    return middleware;
}
