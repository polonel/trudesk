"use strict";

var async = require('async');
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

//Common
middleware.loadCommonData = function(req, res, next) {
    var viewdata = require('../helpers/viewdata');
    viewdata.getData(req, function(data) {
        req.viewdata = data;

        next();
    });
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

};








module.exports = function(server, mongodb) {
    app = server;

    return middleware;
}
