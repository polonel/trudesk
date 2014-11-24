var async = require('async');

var messagesController = {};

messagesController.content = {};

messagesController.get = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-inbox';
    self.content.folder = "Inbox";
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
        function(callback) {
            messages.getUserInbox(req.user._id, function(err, objs) {
                self.content.data.messages.inbox = objs;

                callback(err, objs);
            });
        }
    ],
    function(err, results) {
        res.render('messages', self.content);
    });

};

messagesController.getSentItems = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-sentitems';
    self.content.folder = "Sent Items";

    //Setup Data
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserSentBox(req.user._id, function(err, objs) {
                    self.content.data.messages.inbox = objs;

                    callback(err, objs);
                });
            }
        ],
        function(err, results) {
            res.render('messages', self.content);
        });

};

messagesController.getTrashItems = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-trash';
    self.content.folder = "Trash";
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserTrashBox(req.user._id, function(err, objs) {
                    self.content.data.messages.inbox = objs;

                    callback(err, objs);
                });
            }
        ],
        function(err, results) {
            res.render('messages', self.content);
        });

};

messagesController.getById = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-inbox';
    self.content.folder = "Inbox";
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserInbox(req.user._id, function(err, objs) {
                    self.content.data.messages.inbox = objs;

                    callback(err, objs);
                });
            },
            function(callback) {
                messages.getMessageById(req.params.id, function(err, obj) {
                    self.content.data.messages.message = obj;
                    callback(err, obj);
                });
            }
        ],
        function(err, results) {
            res.render('messages', self.content);
        });
};

module.exports = messagesController;