/*
 .                             .o8                     oooo
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

var async = require('async'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    winston = require('winston'),
    permissions = require('../../../permissions'),
    emitter = require('../../../emitter'),

    userSchema = require('../../../models/user'),
    noticeSchema = require('../../../models/notice');

var api_notices = {};

api_notices.create = function(req, res) {
    var postData = req.body;
    var notice = new noticeSchema(postData);
    notice.save(function(err, notice) {
        if (err) {
            winston.warn(err);
            return res.status(500).send({success: false, error: err.message});
        }

        return res.json(notice);
    });

};

api_notices.updateNotice = function(req, res) {
    var id = req.params.id;
    noticeSchema.getNotice(id, function(err, notice) {
        if (err) return res.status(500).json({success: false, error: err});
        notice.update(req.body, function(err) {
            if (err) return res.status(500).json({success: false, error: err});

            res.json({success: true});
        });
    });
};

api_notices.clearActive = function(req, res) {
    noticeSchema.getNotices(function(err, notices) {
        if (err) return res.status(500).json({success: false, error: err});

        _.each(notices, function(notice) {
            notice.active = false;
            notice.save(function(err) {
                if (err) return res.status(500).json({success: false, error: err});
            });
        });

        res.json({success: true});
    });
};

module.exports = api_notices;