/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    08/05/2015
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


/**
 * @api {post} /api/v1/notices/create Create Notice
 * @apiName create
 * @apiDescription Creates a notice with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Notice
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Notice Name",
 *      "messages": "Notice Message",
 *      "color": "#CCCCC",
 *      "fontColor": "#000000",
 *      "alterWindow": true
 * }
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/notices/create
 *
 * @apiSuccess {object} notice Notice Object that was created.
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_notices.create = function(req, res) {
    var postData = req.body;
    var notice = new noticeSchema(postData);
    notice.save(function(err, notice) {
        if (err) {
            winston.debug(err);
            return res.status(400).send({success: false, error: "Invalid Post Data"});
        }

        return res.json(notice);
    });

};

api_notices.updateNotice = function(req, res) {
    var id = req.params.id;
    noticeSchema.getNotice(id, function(err, notice) {
        if (err) return res.status(400).json({success: false, error: err});
        notice.update(req.body, function(err) {
            if (err) return res.status(400).json({success: false, error: err});

            res.json({success: true});
        });
    });
};

api_notices.clearActive = function(req, res) {
    noticeSchema.getNotices(function(err, notices) {
        if (err) return res.status(400).json({success: false, error: err});

        _.each(notices, function(notice) {
            notice.active = false;
            notice.save(function(err) {
                if (err) return res.status(400).json({success: false, error: err});
            });
        });

        res.json({success: true});
    });
};

api_notices.deleteNotice = function(req, res) {
    var id = req.params.id;
    noticeSchema.getNotice(id, function(err, notice) {
        if (err) return res.status(400).json({success: false, error: err});

        notice.remove(function(err) {
            if (err) return res.status(400).json({success: false, error: err});

            res.json({success: true});
        });
    });
};

module.exports = api_notices;