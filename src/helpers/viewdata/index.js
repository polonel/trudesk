/**
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

var async   = require('async'),
    _       = require('lodash');

var viewController = {};
var viewdata = {};
viewdata.notifications = {};
viewdata.messages = {};

viewController.getData = function(request, cb) {
      async.parallel([
          function(callback) {
              viewController.getUserNotifications(request, function(data) {
                  viewdata.notifications = data;
                  callback(viewdata.notifications);
              })
          },
          function(callback) {
              viewController.unreadMessageCount(request, function(data) {
                  viewdata.messages.unreadCount = data;
                  callback(viewdata.messages.unreadCount);
              });
          },
          function(callback) {
              viewController.loggedInAccount(request, function(data) {
                  viewdata.loggedInAccount = data;
                  callback(viewdata.loggedInAccount);
              });
          }
      ], function(err, results) {
          cb(viewdata);
      });
};

viewController.getUserNotifications = function(request, callback) {
    var notificationsSchema = require('../../models/notification');
    notificationsSchema.findAllForUser(request.user._id, function(err, data) {
        if (err) {
            winston.warn(err.message);
            callback(err);
        }

        callback(data);
    })
};

viewController.unreadMessageCount = function(request, callback) {
    var messageObj = require('../../models/message');
    messageObj.getUnreadInboxCount(request.user._id, function(err, data) {
        if (err) {
            callback(0);
        }

        callback(data);
    });
};

viewController.loggedInAccount = function(request, callback) {
    var userSchema = require('../../models/user');
    userSchema.getUser(request.user._id, function(err, data) {
        if (err) {
            callback(err);
        }

        callback(data);
    });
};

module.exports = viewController;
