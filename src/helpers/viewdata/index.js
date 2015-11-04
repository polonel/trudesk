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

var async   = require('async'),
    _       = require('underscore'),
    winston = require('winston'),
    moment  = require('moment');

var viewController = {};
var viewdata = {};
viewdata.tickets = {};
viewdata.notifications = {};
viewdata.messages = {};

viewController.getData = function(request, cb) {
      async.parallel([
          function(callback) {
              viewController.getActiveNotice(function(err, data) {
                  if (err) return callback(err);
                  viewdata.notice = data;
                  viewdata.noticeCookieName = undefined;

                  if (!_.isUndefined(data) && !_.isNull(data))
                    viewdata.noticeCookieName = data.name + "_" + moment(data.activeDate).format("MMMDDYYYY_HHmmss");

                  callback();
              });
          },
          function(callback) {
              viewController.getUserNotifications(request, function(err, data) {
                  if (err) return callback(err);
                  viewdata.notifications.items = data;
                  callback();
              })
          },
          function(callback) {
              viewController.getUnreadNotificationsCount(request, function(err, count) {
                  if (err) return callback(err);
                  viewdata.notifications.unreadCount = count;
                  callback();
              });
          },
          function(callback) {
              viewController.unreadMessageCount(request, function(data) {
                  viewdata.messages.unreadCount = data;
                  callback();
              });
          },
          function(callback) {
              viewController.getUserUnreadMessages(request, function(data) {
                  viewdata.messages.unreadItems = data;
                  callback();
              });
          },
          function(callback) {
              viewController.getUsers(request, function(users) {
                  viewdata.messages.users = users;

                  callback();
              });
          },
          function(callback) {
              viewController.loggedInAccount(request, function(data) {
                  viewdata.loggedInAccount = data;
                  callback();
              });
          },
          function(callback) {
              viewController.getGroups(request, function(err, data) {
                  if (err) return callback(null, null);

                  viewdata.groups = data;

                  callback();
              });
          }
      ], function(err) {
          if (err) {
              winston.warn('Error: ' + err);
          }

          cb(viewdata);
      });
};

viewController.getActiveNotice = function(callback) {
    var noticeSchema = require('../../models/notice');
    noticeSchema.getActive(function(err, notice) {
        if (err) {
            winston.warn(err.message);
            return callback(err);
        }

        callback(null, notice);
    });
};

viewController.getUserNotifications = function(request, callback) {
    var notificationsSchema = require('../../models/notification');
    notificationsSchema.findAllForUser(request.user._id, function(err, data) {
        if (err) {
            winston.warn(err.message);
            return callback(err);
        }

        callback(null, data);
    })
};

viewController.getUnreadNotificationsCount = function(request, callback) {
    var notificationsSchema = require('../../models/notification');
    notificationsSchema.getUnreadCount(request.user._id, function(err, count) {
        if (err) {
            winston.war(err.message);
            return callback(err);
        }

        callback(null, count);
    });
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

viewController.getUserUnreadMessages = function(request, callback) {
    var messageSchema = require('../../models/message');
    messageSchema.getUserUnreadMessages(request.user._id, function(err, data) {
        if (err) {
            return callback();
        }

        callback(data);
    });
};

viewController.getUsers = function(request, callback) {
    var userSchema = require('../../models/user');
    userSchema.findAll(function(err, users) {
        if (err) {
            winston.warn(err);
            return callback();
        }
        var u = _.sortBy(users, 'fullname');

        callback(u);
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

viewController.getGroups = function(request, callback) {
    var groupSchema = require('../../models/group');
    groupSchema.getAllGroupsOfUser(request.user._id, function(err, data) {
        if (err) {
            winston.debug(err);
            callback(err);
        }

        callback(null, data);
    });
};

module.exports = viewController;
