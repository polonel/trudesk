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
    _s = require('underscore.string'),
    winston = require('winston'),
    passport = require('passport'),
    permissions = require('../permissions'),
    emitter = require('../emitter'),
    userSchema = require('../models/user');

var apiController = {};

apiController.content = {};

apiController.import = function(req, res, next) {
    var fs = require('fs');
    var path = require('path');
    var userModel =  require('../models/user');
    var groupModel = require('../models/group');

    var array = fs.readFileSync(path.join(__dirname, '..', 'import.csv')).toString().split(("\n"));
    var clean = array.filter(function(e){return e;});

    async.eachSeries(clean, function(item, cb) {
        winston.info(item);

        var fields = item.split(',');
        var fullname = fields[0].toString().replace('.', ' ');
        var k = fullname.split(' ');
        var kCap = _s.capitalize(k[0]);
        var kCap1 = _s.capitalize(k[1]);
        fullname = kCap + ' ' + kCap1;

        var groupName = fields[2].replace('\\r', '');
        groupName = _s.trim(groupName);
        var User = new userModel({
            username: fields[0],
            password: 'Granville789',
            email: fields[1],
            fullname: fullname,
            role: 'user'
        });

        async.series([
            function(next) {
                User.save(function(err) {
                    if (err) return next(err);

                    next();
                });
            },
            function(next) {
                winston.debug('Getting Group "' + groupName + '"');
                groupModel.getGroupByName(groupName, function(err, group) {
                    if (err) return next(err);

                    if (_.isUndefined(group) || _.isNull(group)) {
                        return next('no group found = ' + groupName);
                    }

                    group.addMember(User._id, function(err) {
                        if (err) return next(err);

                        group.save(function(err) {
                            if (err) return next(err);

                            next();
                        });
                    });
                });
            }
        ], function(err) {
            if (err) return cb(err);

            cb();
        });
    }, function(err) {
        if (err) return res.status(500).send(err);

        res.status(200).send('Imported ' + _.size(clean));
    });
};

apiController.index = function(req, res, next) {
    res.redirect('login');
};

apiController.login = function(req, res, next) {
    var userModel = require('../models/user');
    var username = req.body.username;
    var password = req.body.password;

    if (_.isUndefined(username) ||
        _.isUndefined(password)) {
        return res.sendStatus(403);
    }

    userModel.getUserByUsername(username, function(err, user) {
        if (err) return res.status(401).json({'success': false, 'error': err.message});
        if (!user) return res.status(401).json({'success': false, 'error': 'Invalid User'});

        if (!userModel.validate(password, user.password)) return res.status(401).json({'success': false, 'error': 'Invalid Password'});

        var resUser = _.clone(user._doc);
        delete resUser.resetPassExpire;
        delete resUser.resetPassHash;
        delete resUser.password;
        delete resUser.iOSDeviceToken;

        user.addAccessToken(function(err, token) {
            if (err) return res.status(401).json({'success': false, 'error': err.message});
            if (!token) return res.status(401).json({'success': false, 'error': 'Invalid AccessToken'});

            return res.json({'success': true, 'accessToken': token, 'user': resUser});
        });
    });
};

apiController.logout = function(req, res, next) {
    var token = req.headers.token;

    userSchema.getUserByAccessToken(token, function(err, user) {
        if (err) return res.status(400).json({'success': false, 'error': err.message});
        if (!user) return res.status(200).json({'success': true});

        user.removeAccessToken(token, function(err, u) {
            if (err) return res.status(400).json({'success': false, 'error': err.message});

//            req.logout();
//            req.session.destroy();

            return res.status(200).json({'success': true});
        });
    });
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

apiController.users.deleteUser = function(req, res) {
    var username = req.params.username;
    if(_.isUndefined(username)) return res.send('Invalid Username.');

    var userModel = require('../models/user');
    var returnData = {
        success: true
    };

    userModel.getUserByUsername(username, function(err, user) {
        if (err) {
            returnData.success = false;
            returnData.error = err.message;
            return res.status(200).json(returnData);
        }

        if (_.isUndefined(user) || _.isNull(user)) {
            returnData.success = false;
            returnData.error = "Invalid User";
            return res.status(200).json(returnData);
        }

        user.remove(function(err) {
            if (err) {
                returnData.success = false;
                returnData.error = err.message;
                return res.status(200).json(returnData);
            }

            res.status(200).json(returnData);
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
    var accessToken = req.query.token;

    if (_.isUndefined(accessToken) || _.isNull(accessToken)) {
        var user = req.user;
        if (_.isUndefined(user) || _.isNull(user)) return res.status(401).json({error: 'Invalid Access Token'});

        var groupSchema = require('../models/group');
        groupSchema.getAllGroupsOfUser(user._id, function(err, groups) {
            if (err) return res.send(err.message);

            return res.json(groups);
        });
    } else {
        userSchema.getUserByAccessToken(accessToken, function(err, user) {
            if (err) return res.status(401).json({'error': err.message});
            if (!user) return res.status(401).json({'error': 'Unknown User'});

            var groupSchema = require('../models/group');
            groupSchema.getAllGroupsOfUser(user._id, function(err, groups) {
                if (err) return res.send(err.message);

                res.json(groups);
            });
        });
    }
};

apiController.groups.create = function(req, res, next) {
    if (_.isUndefined(req.user)) return res.send('Error: Not Currently Logged in.');
    var groupSchema = require('../models/group');
    var Group = new groupSchema();

    Group.name = req.body.name;
    Group.members = req.body.members;
    Group.save(function(err, group) {
        if (err) return res.status(400).send('Error: ' + err.message);

        res.status(200).json(group);
    });
};

apiController.groups.updateGroup = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data) || !_.isObject(data)) return res.status(400).send('Error: Misformated Data.');
    var groupSchema = require('../models/group');
    groupSchema.getGroupById(data.id, function(err, group) {
        if (err) return res.status(400).send('Error: ' + err.message);

        group.name = data.name;
        group.members = data.members;

        group.save(function(err, g) {
            if (err) return res.status(400).send('Error: ' + err.message);

            res.json(g);
        });
    });
};

apiController.groups.deleteGroup = function(req, res) {
    if (_.isUndefined(req.user)) return res.send('Error: Not Currently Logged in.');
    var groupSchema = require('../models/group');
    var ticketSchema = require('../models/ticket');
    var id = req.params.id;
    if (_.isUndefined(id)) return res.status(400).send('Error: Invalid Group Id.');
    var returnData = {
        success: true
    };

    async.series([
        function(next) {
            var grps = [id];
            ticketSchema.getTickets(grps, function(err, tickets) {
                if (err) {
                    return next('Error: ' + err.message);
                }

                if (_.size(tickets) > 0) {
                    return next('Error: Cannot delete a group with tickets.');
                }

                next();
            });
        },
        function(next) {
            groupSchema.getGroupById(id, function(err, group) {
                if (err) return next('Error: ' + err.message);

                group.remove(function(err, success) {
                    if (err) return next('Error: ' + err.message);

                    winston.warn('Group Deleted: ' + group._id);
                    next(null, success);
                });
            });
        }
    ], function(err, done) {
        if (err) {
            returnData.success = false;
            returnData.error = err;

            return res.status(200).json(returnData);
        }

        returnData.success = true;
        return res.status(200).json(returnData);
    });
};

//Tickets
apiController.tickets = {};
apiController.tickets.get = function(req, res, next) {
    var accessToken = req.query.token;
    if (_.isUndefined(accessToken) || _.isNull(accessToken)) return res.status(400).json({error: 'Invalid Access Token'});
    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(400).json({'error': err.message});
        if (!user) return res.status(401).json({'error': 'Unknown User'});

        var limit = req.query.limit;
        var page = req.query.page;
        var closed = req.query.closed;
        closed = !(closed != null && closed == 'false');
        var assignedSelf = req.query.assignedself;

        var object = {
            user: user,
            limit: limit,
            page: page,
            closed: closed,
            assignedSelf: assignedSelf
        };

        var ticketModel = require('../models/ticket');
        var groupModel = require('../models/group');

        async.waterfall([
            function(callback) {
                groupModel.getAllGroupsOfUser(user._id, function(err, grps) {
                    callback(err, grps);
                })
            },
            function(grps, callback) {
                ticketModel.getTicketsWithObject(grps, object, function(err, results) {

                    callback(err, results);
                });
            }
        ], function(err, results) {
            if (err) return res.send('Error: ' + err.message);

            return res.json(results);
        });
    });
};

apiController.tickets.create = function(req, res) {
    var accessToken = req.headers.accessToken;

    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(400).json({'success': false, 'error': err.message});
        if (!user) return res.status(200).json({'success': true});

        var response = {};
        response.success = true;

        var postData = req.body;
        if (!_.isObject(postData)) return res.status(500).json({'success': false, Error: 'Invalid Post Data'});

        var ticketModel = require('../models/ticket');
        var ticket = new ticketModel(postData);
        ticket.save(function(err, t) {
            if (err) {
                response.success = false;
                response.error = err;
                return res.status(500).json(response);
            }

            response.ticket = t;
            res.json(response);
        });
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
    var accessToken = req.query.token;
    if (_.isUndefined(accessToken) || _.isNull(accessToken)) return res.status(401).json({error: 'Invalid Access Token'});
    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(401).json({'error': err.message});
        if (!user) return res.status(401).json({'error': 'Unknown User'});

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

apiController.tickets.getMonthData = function(req, res) {
    var ticketModel = require('../models/ticket');
    var now = new Date();
    var data = [];
    var newData = {data: [], label: 'New'};
    var closedData = {data: [], label: 'Closed'};

    var dates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];


    async.series({
        newCount: function(cb) {
            async.forEachSeries(dates, function(value, next) {
                var d = [];
                var date = new Date(now.getFullYear(), value, 1).getTime();
                d.push(date);
                ticketModel.getMonthCount(value, 0, function(err, count) {
                    if (err) return next(err);

                    d.push(Math.round(count));
                    newData.data.push(d);
                    next();
                });
            }, function(err) {
                if (err) return cb(err);

                cb();
            });
        },
        closed: function(cb) {
            async.forEachSeries(dates, function(value, next) {
                var d = [];
                var date = new Date(now.getFullYear(), value, 1).getTime();
                d.push(date);
                ticketModel.getMonthCount(value, 3, function(err, count) {
                    if (err) return next(err);

                    d.push(Math.round(count));
                    closedData.data.push(d);
                    next();
                });
            }, function(err) {
                if (err) return cb(err);

                cb();
            });
        }
    }, function(err, done) {
        if (err) return res.status(400).send(err);

        data.push(newData);
        data.push(closedData);
        res.json(data);
    });
};

apiController.tickets.flotData = function(req, res) {

};

apiController.tickets.getYearData = function(req, res) {
    var ticketModel = require('../models/ticket');
    var year = req.params.year;

    var returnData = {};

    async.parallel({
        newCount: function(next) {
            ticketModel.getYearCount(year, 0, function(err, count) {
                if (err) return next(err);

                next(null, count);
            });
        },

        closedCount: function(next) {
            ticketModel.getYearCount(year, 3, function(err, count) {
                if (err) return next(err);

                next(null, count);
            });
        }
    }, function(err, done) {
        returnData.newCount = done.newCount;
        returnData.closedCount = done.closedCount;

        res.json(returnData);
    });
};

//Roles
apiController.roles = {};
apiController.roles.get = function(req, res, next) {
    var roles = permissions.roles;
    return res.json(roles);
};

module.exports = apiController;
