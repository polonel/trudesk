/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/29/2015
 Author:     Chris Brame

 **/

var async = require('async'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    winston = require('winston'),
    permissions = require('../../../permissions'),
    emitter = require('../../../emitter'),

    userSchema = require('../../../models/user'),
    messageSchema = require('../../../models/message');

var api_messages = {};

/**
 * @api {get} /api/v1/messages Get Messages
 * @apiName getMessages
 * @apiDescription Gets messages for the current logged in user
 * @apiVersion 0.1.0
 * @apiGroup Messages
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/messages
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      messages
 * @apiSuccess {object}     messages._id        The MongoDB ID
 * @apiSuccess {object}     messages.owner      Message Owner
 * @apiSuccess {object}     messages.from       Message From
 * @apiSuccess {string}     messages.subject    Message Subject
 * @apiSuccess {string}     messages.message    Message Text
 * @apiSuccess {date}       messages.date       Message Date
 * @apiSuccess {boolean}    messages.unread     Unread?
 * @apiSuccess {number}     messages.folder     Message Folder
 *
 */
api_messages.get = function(req, res) {
    var user = req.user;
    var limit = req.query.limit;
    var page = req.query.page;
    var folder = req.query.folder;

    var object = {
        owner: user,
        limit: limit,
        page: page,
        folder: folder
    };

    messageSchema.getMessagesWithObject(object, function(err, results) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true, messages: results});
    });
};

api_messages.send = function(req, res) {
    var accessToken = req.headers.accesstoken;
    var messageData = req.body;

    if (_.isUndefined(accessToken) || _.isNull(accessToken)) {
        var user = req.user;
        if (_.isUndefined(user) || _.isNull(user)) return res.status(401).json({error: 'Invalid Access Token'});

        var to = messageData.to;
        if (!_.isArray(to)) {
            to = [messageData.to]
        }
        var marked = require('marked');
        var messageText = messageData.message;
        messageText = messageText.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        messageData.message = marked(messageText);

        async.each(to, function(owner, callback) {
            async.parallel([
                function(done) {
                    var message = new messageSchema({
                        owner: owner,
                        from: user._id,
                        subject: messageData.subject,
                        message: messageData.message
                    });

                    message.save(function(err) {
                        done(err);
                    });
                },
                function(done) {
                    //Save to Sent Items
                    var message = new messageSchema({
                        owner: user._id,
                        from: owner,
                        folder: 1,
                        subject: messageData.subject,
                        message: messageData.message
                    });

                    message.save(function(err) {
                        done(err);
                    });
                }
            ], function(err) {
                if (err) return callback(err);
                callback();
            });
        }, function(err) {
            if (err) return res.status(400).json({error: err});

            res.status(200).json({success: true});
        });
    } else {
        //get user by access token
        userSchema.getUserByAccessToken(accessToken, function(err, user) {
            if (err) return res.status(401).json({'error': err.message});
            if (!user) return res.status(401).json({'error': 'Unknown User'});

        });
    }
};

module.exports = api_messages;