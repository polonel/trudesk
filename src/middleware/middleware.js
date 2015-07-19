/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

"use strict";

var async = require('async');
var _ = require('lodash');
var db = require('../database');
var path = require('path');
var multer = require('multer');
var mongoose = require('mongoose');
var winston = require('winston');

var app,
    middleware = {};

middleware.db = function(req, res, next) {
    winston.info('Checking MongoDB Status...');
    if (mongoose.connection.readyState !== 1) {
        winston.warn('MongoDB ReadyState = ' + mongoose.connection.readyState);
        db.init(function(e, database) {
            if (e) {
                return res.status(503).send();
            }

            req.db = database;
        });
    }

    next();
};

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
        if (!_.isUndefined(req.session))
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

middleware.cache = function(seconds) {
    return function(req, res, next) {
        res.setHeader("Cache-Control", "public, max-age=" + seconds);

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

};

module.exports = function(server) {
    app = server;

    return middleware;
};
