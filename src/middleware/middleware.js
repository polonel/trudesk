"use strict";

var async = require('async');
var _ = require('lodash');
var db = require('../database');
var path = require('path');
var multer = require('multer');

var app,
    middleware = {};

middleware.multerToUserDir = function(req, res, next) {
    multer({dest: path.join(__dirname, '../../', 'public/uploads/users')});

    next();
};

middleware.redirectToDashboardIfLoggedIn = function(req, res, next) {
    if (req.user) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

middleware.redirectToLogin = function(req, res, next) {
    if (!req.user) {
        req.session.redirectUrl = req.url;
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
};
