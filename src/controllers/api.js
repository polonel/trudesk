var async = require('async'),
    _ = require('lodash'),
    winston = require('winston'),

    permissions = require('../permissions');

var apiController = {};

apiController.content = {};

apiController.index = function(req, res, next) {
    res.redirect('login');
};

apiController.users = {};
apiController.users.get = function(req, res, next) {
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

apiController.users.single = function(req, res, next) {
    var username = req.params.username;
    if(_.isUndefined(username)) return res.send('Invalid Username.');

    var userModel = require('../models/user');
    userModel.getUserByUsername(username, function(err, user) {
        if (err) return res.send("Invalid User.");

        if (_.isUndefined(user) || _.isNull(user)) return res.send("Invalid User.");

        res.json(user);
    });
};

//Tickets
apiController.tickets = {};
apiController.tickets.get = function(req, res, next) {
    var ticketModel = require('../models/ticket');
    ticketModel.getAll(function(err, tickets) {
        if (err) return res.send(err);

        return res.json(tickets);
    });
};

apiController.tickets.single = function(req, res, next) {
    var uid = req.params.uid;
    if (_.isUndefined(uid)) return res.send('Invalid Ticket Id');

    var ticketModel = require('../models/ticket');
    ticketModel.getTicketByUid(uid, function(err, ticket) {
        if (err) return res.send(err);

        if (_.isUndefined(ticket) || _.isNull(ticket)) return res.send("Invalid Ticket Id");

        return res.json(ticket);
    });
};

//Roles
apiController.roles = {};
apiController.roles.get = function(req, res, next) {
    var roles = permissions.roles;
    return res.json(roles);
};

module.exports = apiController;
