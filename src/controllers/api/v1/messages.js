/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/24/2016
 Author:     Chris Brame

 **/

var async = require('async'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    winston = require('winston'),
    permissions = require('../../../permissions'),
    emitter = require('../../../emitter'),

    userSchema = require('../../../models/user'),

    conversationSchema = require('../../../models/chat/conversation');
    messageSchema = require('../../../models/chat/message');

var api_messages = {};

/**
 * @api {get} /api/v1/messages Get Messages
 * @apiName getMessages
 * @apiDescription Gets messages for the current logged in user
 * @apiVersion 0.1.8
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

api_messages.getConversations = function(req, res) {
    conversationSchema.getConversations(req.user._id, function(err, conversations) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true, conversations: conversations});
    });
};

api_messages.getRecentConversations = function(req, res) {
    conversationSchema.getConversationsWithLimit(req.user._id, 3, function(err, conversations) {
        if (err) return res.status(400).json({success: false, error: err.message});

        var result = [];
        async.eachSeries(conversations, function(item, done) {
            messageSchema.getMostRecentMessage(item._id, function(err, m) {
                if (err) return done(err);
                var r = item.toObject();
                r.recentMessage = _.first(m);
                r.recentMessage.__v = undefined;

                result.push(r);
                done();
            })
        }, function(err) {
            if (err) return res.status(400).json({success: false, error: err});
            return res.json({success: true, conversations: result});
        });
    });
};

api_messages.get = function(req, res) {
    conversationSchema.getConversations(req.user._id, function(err, conversations) {
        if (err) return res.status(400).json({success: false, error: err});
        var fullConversations = [];

        async.forEach(conversations, function(item, done) {

            messageSchema.getFullConversation(item._id, function(err, messages) {
                if (err) return done(err);
                console.log(item);
                fullConversations.push({cId: item._id, p: item.participants, messages: messages});

                return done();
            });
        }, function(err) {
            if (err) return res.status(400).json({success: false, error: err});
            return res.json({success: true, conversations: fullConversations});
        });

    });
};

api_messages.startConversation = function(req, res) {
    var payload = req.body;
    var requester = payload.owner;
    var participants = payload.participants;

    //Check if Conversation with these participants exist
    conversationSchema.getConversations(participants, function(err, convo) {
        if (err) {
            //winston.debug(err);
            return res.status(400).json({success: false, error: err.message});
        }

        if (convo.length == 1) {
            //winston.debug('Using Convo Found: ' + convo[0]);
            return res.json({success: true, conversation: convo[0]});
        } else {
            var userMeta = [];
            _.each(participants, function(item) {
                var meta =  {
                    userId: item,
                    joinedAd: new Date()
                };

                if (requester == item)
                    meta.lastRead = new Date();

                userMeta.push(meta);
            });

            var Conversation = new conversationSchema({
                participants: participants,
                userMeta: userMeta
            });

            Conversation.save(function(err, cSave) {
                if (err) {
                    winston.debug(err);
                    return res.status(400).json({success: false, error: err.message});
                }

                return res.json({success: true, conversation: cSave});
            });
        }
    });
};

api_messages.send = function(req, res) {
    var payload = req.body;
    var cId = payload.cId;
    var owner = payload.owner;
    var message = payload.body;
    var matches = message.match(/^[Tt]#[0-9]*$/g);

    if (!_.isNull(matches) && matches.length > 0) {
        _.each(matches, function(m) {
            console.log(m);
            message = message.replace(m, '<a href="/tickets/' + m.replace('T#', '').replace('t#', '') + '">T#' + m.replace('T#', '').replace('t#', '') + '</a>');
        });
    }

    async.waterfall([
        function(done) {
            conversationSchema.findOneAndUpdate({_id: cId}, {}, {new: false}, function(err, convo) {
                if (err) return done(err);
                return done(null, convo);
            });
        },
        function(convo, done) {
            var Message = new messageSchema({
                conversation: convo._id,
                owner: owner,
                body: message
            });

            Message.save(function(err, mSave) {
                if (err) {
                    return done(err);
                }

                //Update conversation Meta!!
                return done(null, mSave);
            });
        }
    ], function(err, mSave) {
        if (err) {
            winston.debug(err);
            return res.status(400).json({success: false, error: err.message});
        }
        return res.json({success: true, message: mSave});

    });


};

api_messages.getMessagesForConversation = function(req, res) {
    var conversation = req.params.id;
    if (_.isUndefined(conversation) || _.isNull(conversation))
        return res.status(400).json({success: false, error: 'Invalid Conversation'});

    var response = {};
    async.parallel([
        function(done) {
            conversationSchema.getConversation(conversation, function(err, convo) {
                if (err) return done(err);

                response.conversation = convo;

                done();
            });
        },
        function(done) {
            messageSchema.getConversation(conversation, function(err, messages) {
                if (err) return done(err);

                response.messages = messages;

                done();
            })
        }
    ], function(err) {
        if (err) {
            winston.debug(err);
            return res.status(400).json({success: false, error: err.message});
        }

        return res.json({success: true, conversation: response.conversation, messages: response.messages});
    });
};

module.exports = api_messages;