var async = require('async'),
    _ = require('lodash'),
    winston = require('winston'),
    passport = require('passport'),
    permissions = require('../permissions');

var apiController = {};

apiController.content = {};

apiController.index = function(req, res, next) {
    res.redirect('login');
};

apiController.login = function(req, res, next) {
    var userModel = require('../models/user');
    var username = req.body.username;
    var password = req.body.password;
    var apitoken = req.body.apitoken;

    if (_.isUndefined(username) ||
        _.isUndefined(password) ||
        _.isUndefined(apitoken)) {
        return res.sendStatus(403);
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) return next(err);
        if (!user) return res.sendStatus(401);

        req.logIn(user, function(err) {
            if (err) return res.send(err.message);

            return res.send(200);
        })
    })(req, res, next);
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

//Groups
apiController.groups = {};
apiController.groups.get = function(req, res, next) {
    if (_.isUndefined(req.user)) return res.send('Error: Not Currently Logged in.');
    var groupSchema = require('../models/group');
    var username = req.user._id;
    groupSchema.getAllGroupsOfUser(username, function(err, groups) {
        if (err) return res.send(err.message);

        res.json(groups);
    });
};

//Tickets
apiController.tickets = {};
apiController.tickets.get = function(req, res, next) {
    var user = req.user;
    //var apiToken = req.headers.apitoken;
    //if (_.isUndefined(apiToken)) return res.send('Error: Not Currently Logged in.');
    if (_.isUndefined(user)) return res.send('Error: Not Currently Logged in.');

    var ticketModel = require('../models/ticket');
    var groupModel = require('../models/group');

    async.waterfall([
        function(callback) {
            groupModel.getAllGroupsOfUser(user._id, function(err, grps) {
                callback(err, grps);
            })
        },
        function(grps, callback) {
            ticketModel.getTickets(grps, function(err, results) {

                callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return res.send('Error: ' + err.message);

        return res.json(results);
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

apiController.tickets.update = function(req, res, next) {
    var oId = req.params.id;
    var reqTicket = req.body;
    if (_.isUndefined(oId)) return res.send("Invalid Ticket Id");
    var ticketModel = require('../models/ticket');
    ticketModel.getTicketById(oId, function(err, ticket) {
        if (err) return res.send(err.message);

        if (!_.isUndefined(reqTicket.status))
            ticket.status = reqTicket.status;

        if (!_.isUndefined(reqTicket.group))
            ticket.group = reqTicket.group;

        ticket.save(function(err, t) {
            if (err) return res.send(err.message);
            res.json(t);
        });
    });
};

apiController.tickets.delete = function(req, res, next) {
    var oId = req.params.id;
    if (_.isUndefined(oId)) return res.send("Invalid Ticket Id");
    var ticketModel = require('../models/ticket');
    ticketModel.remove({_id: oId}, function(err) {
        if (err) return res.send(err.message);

        res.sendStatus(200);
    });
};

apiController.tickets.getTypes = function(req, res, next) {
    var ticketType = require('../models/tickettype');
    ticketType.getTypes(function(err, types) {
        if (err) return res.send(err);

        res.json(types);
    })
};

//Roles
apiController.roles = {};
apiController.roles.get = function(req, res, next) {
    var roles = permissions.roles;
    return res.json(roles);
};

module.exports = apiController;
