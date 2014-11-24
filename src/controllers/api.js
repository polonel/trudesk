var async = require('async'),
    _ = require('lodash'),
    winston = require('winston');

var apiController = {};

apiController.content = {};

apiController.index = function(req, res, next) {
    "use strict";
    res.redirect('login');
};

apiController.users = {};
apiController.users.get = function(req, res, next) {
  "use strict";
  var userModel = require('../models/user');
  userModel.findAll(function(err, items) {
      if (err) {
        winston.error("Error: " + err);
        return res.send(err);
      }

      return res.json(items);
  });
};

apiController.users.insert = function(req, res, next) {
    "use strict";
    var data = req.body;
    var userModel = require('../models/user');

    userModel.insertUser(data, function(err, r) {
        if (err) {
          winston.warn("Error: " + err);
          return res.send(err);
        }

        return res.send(r);
    });

};

module.exports = apiController;
