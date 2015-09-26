/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    03/27/2015
 Author:     Chris Brame

 **/

var async           = require('async');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var noticeSchema    = require('../models/notice');
var permissions     = require('../permissions');
var mongoose        = require('mongoose');

var noticesController = {};

noticesController.content = {};

noticesController.get = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Notices";
    self.content.nav = 'notices';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.notices = [];

    //self.content.data.common.notice = {
    //    date: Date.now(),
    //    color: '#7FE73A',
    //    message: 'Internet is experiencing issues.'
    //};

    noticeSchema.getNotices(function(err, notices) {
        if (err) return handleError(res, err);
        self.content.data.notices = notices;

        res.render('notices', self.content);
    });
};

noticesController.create = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Notices - Create";
    self.content.nav = 'notices';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    res.render('subviews/createNotice', self.content);
};

noticesController.edit = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Notices - Edit";
    self.content.nav = 'notices';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    noticeSchema.getNotice(req.params.id, function(err, notice) {
        if (err) return handleError(res, err);
        self.content.data.notice = notice;

        res.render('subviews/editNotice', self.content);
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = noticesController;