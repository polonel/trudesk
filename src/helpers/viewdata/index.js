var async   = require('async'),
    _       = require('lodash');

var viewController = {};
var viewdata = {};
viewdata.messages = {};

viewController.getData = function(request, cb) {
      async.parallel([
          function(callback) {
              viewController.unreadMessageCount(request, function(data) {
                  viewdata.messages.unreadCount = data;
                  callback(viewdata.messages.unreadCount);
              });
          },
          function(callback) {
              "use strict";
              viewController.loggedInAccount(request, function(data) {
                  viewdata.loggedInAccount = data;
                  callback(viewdata.loggedInAccount);
              });
          }
      ], function(err, results) {
          cb(viewdata);
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
