var express     = require('express'),
    router      = express.Router(),
    path        = require('path'),
    winston     = require('winston'),
    passport = require('passport');

var controller = require('../controllers/index');

module.exports = function(router, middleware) {
    router.get('/plugins/ipam', middleware.redirectToLogin, middleware.loadCommonData, controller.get);
};