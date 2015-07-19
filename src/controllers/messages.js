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

var _       = require('underscore'),
    async   = require('async'),
    userSchema = require('../models/user');

var messagesController = {};

messagesController.content = {};

messagesController.get = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Messages";
    self.content.nav = 'messages';
    self.content.subnav = 'messages-inbox';
    self.content.folder = "Inbox";
    self.content.folderNum = 0;
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
        function(callback) {
            messages.getUserFolder(req.user._id, 0, function(err, objs) {
                self.content.data.messages.items = objs;
                self.content.data.messages.count = _.size(objs);
                callback(err, objs);
            });
        }
    ],
    function(err, results) {
        if (err) return res.render('error', err);

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
    self.content.folderNum = 1;
    //Setup Data
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserFolder(req.user._id, 1, function(err, objs) {
                    self.content.data.messages.items = objs;
                    self.content.data.messages.count = _.size(objs);

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
    self.content.folderNum = 2;
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserFolder(req.user._id, 2, function(err, objs) {
                    self.content.data.messages.items = objs;
                    self.content.data.messages.count = _.size(objs);

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
    self.content.folderNum = 0;
    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;


    var messages = require('../models/message');
    self.content.data.messages = {};
    async.parallel([
            function(callback) {
                messages.getUserFolder(req.user._id, 0, function(err, objs) {
                    self.content.data.messages.items = objs;
                    self.content.data.messages.count = _.size(objs);

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
            if (err) {
                throw new Error(err);
            }

            res.render('messages', self.content);
        });
};

module.exports = messagesController;