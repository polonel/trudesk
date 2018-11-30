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

'use strict';

var _ = require('lodash');
var db = require('../database');
var mongoose = require('mongoose');
var winston = require('winston');

var middleware = {};

middleware.db = function(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
        winston.warn('MongoDB ReadyState = ' + mongoose.connection.readyState);
        db.init(function(e, database) {
            if (e) 
                return res.status(503).send();
            

            req.db = database;
        });
    }

    return next();
};

middleware.redirectToDashboardIfLoggedIn = function(req, res, next) {
    if (req.user) {
        if (req.user.hasL2Auth) 
            return middleware.ensurel2Auth(req, res, next);

        if (req.user.role === 'user')
            return res.redirect('/tickets');

        return res.redirect('/dashboard');
    }

    return next();
};

middleware.redirectToLogin = function(req, res, next) {
    if (!req.user) {
        if (!_.isUndefined(req.session))
            req.session.redirectUrl = req.url;

        return res.redirect('/');
    }

    if (req.user.deleted) {
        req.logout();
        req.session.l2auth = null;
        req.session.destroy();
        return res.redirect('/');
    }

    if (req.user.hasL2Auth) {
        if (req.session.l2auth !== 'totp')
            return res.redirect('/');

    }

    return next();

};

middleware.redirectIfUser = function(req, res, next) {
    if (!req.user) {
        if (!_.isUndefined(req.session))
            res.session.redirectUrl = req.url;

        return res.redirect('/');
    }

    if (req.user.role === 'user')
        return res.redirect(301, '/tickets');


    return next();
};

middleware.ensurel2Auth = function(req, res, next) {
    if (req.session.l2auth === 'totp') {
        if (req.user)
            {if (req.user.role !== 'user')
                return res.redirect('/dashboard');
            else
                return res.redirect('/tickets');}
        else
            return next();
    } else 
        return res.redirect('/l2auth');
    
};

//Common
middleware.loadCommonData = function(req, res, next) {
    var viewdata = require('../helpers/viewdata');
    viewdata.getData(req, function(data) {
        req.viewdata = data;

        return next();
    });
};

middleware.cache = function(seconds) {
    return function(req, res, next) {
        res.setHeader('Cache-Control', 'public, max-age=' + seconds);

        next();
    };
};

middleware.checkCaptcha = function(req, res, next) {
    var postData = req.body;
    if (postData === undefined) 
        return res.status(400).json({success: false, error: 'Invalid Captcha'});
    

    var captcha = postData.captcha;
    var captchaValue = req.session.captcha;

    if (captchaValue === undefined) 
        return res.status(400).json({success: false, error: 'Invalid Captcha'});
    

    if (captchaValue.toString() !== captcha.toString())
        return res.status(400).json({success: false, error: 'Invalid Captcha'});

    return next();
};

middleware.checkOrigin = function(req, res, next) {
    var origin = req.headers.origin;
    var host = req.headers.host;

    //Firefox Hack - Firefox Bug 1341689 & 1424076
    //Trudesk Bug #26
    //TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
    if (!origin)
        origin = host;

    origin = origin.replace(/^https?:\/\//, '');

    if (origin !== host)
        return res.status(400).json({success: false, error: 'Invalid Origin!'});

    return next();
};

//API
middleware.api = function(req, res, next) {
    var accessToken = req.headers.accesstoken,
        userSchema = require('../models/user');

    if (_.isUndefined(accessToken) || _.isNull(accessToken)) {
        var user = req.user;
        if (_.isUndefined(user) || _.isNull(user)) return res.status(401).json({error: 'Invalid Access Token'});

        return next();
    }

    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(401).json({'error': err.message});
        if (!user) return res.status(401).json({'error': 'Invalid Access Token'});

        req.user = user;

        return next();
    });
};

middleware.hasAuth = middleware.api;

middleware.isAdmin = function(req, res, next) {
      if (req.user.role === 'admin')
          return next();

      return res.status(401).json({success: false, error: 'Not Authorized for this API call.'});
};

middleware.isMod = function(req, res, next) {
    if (req.user.role === 'mod' || req.user.role === 'admin')
        return next();

    return res.status(401).json({success: false, error: 'Not Authorized for this API call.'});
};

middleware.isSupport = function(req, res, next) {
    if (req.user.role === 'support' || req.user.role === 'mod' || req.user.role === 'admin')
        return next();

    return res.status(401).json({success: false, error: 'Not Authorized for this API call.'});
};

module.exports = function() {
    return middleware;
};
