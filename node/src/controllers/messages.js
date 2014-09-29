var async = require('async');

var messagesController = {};

messagesController.content = {};

messagesController.get = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-inbox';
    self.content.data = {};
    self.content.data.user = req.user;


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
        console.log(results);
        res.render('messages', self.content);
    });

};

module.exports = messagesController;