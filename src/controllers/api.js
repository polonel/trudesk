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

var async = require('async'),
    _ = require('underscore'),
    winston = require('winston'),
    passport = require('passport'),
    permissions = require('../permissions'),
    emitter = require('../emitter');

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
          winston.warn("Error: " + err.message);
          return res.send(err);
        }

        return res.send(r);
    });
};

apiController.users.update = function(req, res, next) {
    var data = req.body;
    var userModel = require('../models/user');

    userModel.getUser(data._id, function(err, user) {
        if (err) {
            winston.warn('Error: ' + err);
            return res.status(500).send(err);
        }

        user.fullname = data.fullname;
        user.email = data.email;

        if (!_.isEmpty(data.password) && !_.isEmpty(data.cPassword)) {
            if (data.password === data.cPassword) {
                user.password = data.password;
            }
        }

        user.save(function(err, nUser) {
            if (err) {
                winston.warn('Error: ' + err);
                return res.status(500).send(err);
            }
            return res.json(nUser);
        });
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
    ticketModel.softDelete(oId, function(err) {
        if (err) return res.status(400).send(err.message);

        emitter.emit('ticket:deleted', oId);
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
