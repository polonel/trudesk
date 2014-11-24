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

module.exports = viewController;
