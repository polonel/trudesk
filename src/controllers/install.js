/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    07/11/2016
 Author:     Chris Brame

 **/

var async           = require('async'),
    path            = require('path'),
    _               = require('lodash'),
    winston         = require('winston'),
    Chance = require('chance');

var installController = {};

installController.content = {};

installController.index = function(req, res) {
    var self = installController;
    self.content = {};
    self.content.title = "Install Trudesk";
    self.content.layout = false;


    res.render('install', self.content);
};

installController.mongotest = function(req, res) {
    var origin = req.headers.origin;
    var host = req.headers.host;
    if (req.secure) host = 'https://' + host;
    if (!req.secure) host = 'http://' + host;

    //Firefox Hack - Firefox Bug 1341689
    //Trudesk Bug #26
    //TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
    if (!origin) origin = host;

    if (origin !== host) return res.status(400).json({success: false, error: 'Invalid Origin!'});

    var data = req.body;
    var dbPassword = encodeURIComponent(data.password);
    var CONNECTION_URI = 'mongodb://' + data.username + ':' + dbPassword + '@' + data.host + ':' + data.port + '/' + data.database;

    var child = require('child_process').fork(path.join(__dirname, '../../src/install/mongotest'), { env: { FORK: 1, NODE_ENV: global.env, MONGOTESTURI: CONNECTION_URI } });
    global.forks.push({name: 'mongotest', fork: child});
    child.on('message', function(data) {
        if (data.error) return res.status(400).json({success: false, error: data.error});

        return res.json({success: true});
    });

    child.on('close', function(code, signal) {
        winston.debug('MongoTest process terminated');
    })
};

installController.existingdb = function(req, res) {
    var origin = req.headers.origin;
    var shost = req.headers.host;
    if (req.secure) shost = 'https://' + shost;
    if (!req.secure) shost = 'http://' + shost;

    //Firefox Hack - Firefox Bug 1341689
    //Trudesk Bug #26
    //TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
    if (!origin) origin = shost;

    if (origin !== shost) return res.status(400).json({success: false, error: 'Invalid Origin!'});

    var data        = req.body;

    //Mongo
    var host        = data['host'];
    var port        = data['port'];
    var database    = data['database'];
    var username    = data['username'];
    var password    = data['password'];

    //Write Configfile
    var fs = require('fs');
    var configFile = path.join(__dirname, '../../config.json');

    var conf = {
        mongo: {
            host: host,
            port: port,
            username: username,
            password: password,
            database: database
        }
    };

    fs.writeFile(configFile, JSON.stringify(conf, null, 4), function(err) {
        if (err) {
            winston.error('FS Error: ' + err.message);
            return res.status(400).json({success: false, error: err.message});
        }

        return res.json({success: true});
    });
};

installController.install = function(req, res) {
    var origin = req.headers.origin;
    var shost = req.headers.host;
    if (req.secure) shost = 'https://' + shost;
    if (!req.secure) shost = 'http://' + shost;

    //Firefox Hack - Firefox Bug 1341689
    //Trudesk Bug #26
    //TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
    if (!origin) origin = shost;

    if (origin !== shost) return res.status(400).json({success: false, error: 'Invalid Origin!'});

    var db                  = require('../database');
    var userSchema          = require('../models/user');
    var groupSchema         = require('../models/group');
    var counters            = require('../models/counters');
    var ticketTypeSchema    = require('../models/tickettype');

    var data = req.body;

    //Mongo
    var host = data['mongo[host]'];
    var port =  data['mongo[port]'];
    var database = data['mongo[database]'];
    var username = data['mongo[username]'];
    var password = data['mongo[password]'];

    //Account
    var user = {
        username: data['account[username]'],
        password: data['account[password]'],
        passconfirm: data['account[cpassword]'],
        email: data['account[email]'],
        fullname: data['account[fullname]']
    };

    var conuri = 'mongodb://' + username + ':' + password + '@' + host + ':' + port + '/' + database;

    async.waterfall([
        function(next) {
            db.init(function(err) {
                return next(err);
            }, conuri);
        },
        function(next) {
            var Counter = new counters({
                _id: "tickets",
                next: 1001
            });

            Counter.save(function(err){return next(err);});
        },
        function(next) {
            var Counter = new counters({
                _id: "reports",
                next: 1001
            });

            Counter.save(function(err) {
                return next(err);
            });
        },
        function(next) {
            var type = new ticketTypeSchema({
                name: 'Issue'
            });

            type.save(function(err){return next(err); });
        },
        function(next) {
            var type = new ticketTypeSchema({
                name: 'Task'
            });

            type.save(function(err){return next(err); });
        },
        function(next) {
            groupSchema.getGroupByName('Administrators', function(err, group) {
                if (err) {
                    winston.error('Database Error: ' + err.message);
                    return next('Database Error:' + err.message);
                }

                if (!_.isNull(group) && !_.isUndefined(group) && !_.isEmpty(group)) {
                    // Already Exists Create Admin
                    return next(null, group);
                } else {
                    //Create Admin Group
                    var adminGroup = new groupSchema({
                        name: 'Administrators',
                        members: []
                    });

                    adminGroup.save(function(err) {
                        if (err) {
                            winston.error('Database Error:' + err.message);
                            return next('Database Error:' + err.message);
                        }

                        return next(null, adminGroup);
                    });
                }
            });
        },
        function (adminGroup, next) {
            userSchema.getUserByUsername(user.username, function(err, admin) {
                if (err) {
                    winston.error('Database Error: ' + err.message);
                    return next('Database Error: ' + err.message);
                }

                if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
                    return next('Username: ' + user.username + ' already exists.');
                } else {
                    if (user.password !== user.passconfirm)
                        return next('Passwords do not match!');

                    var chance = new Chance();
                    var adminUser = new userSchema({
                        username:   user.username,
                        password:   user.password,
                        fullname:   user.fullname,
                        email:      user.email,
                        role:       'admin',
                        title:      'Administrator',
                        accessToken:chance.hash()
                    });

                    adminUser.save(function(err, savedUser) {
                        if (err) {
                            winston.error('Database Error: ' + err.message);
                            return next('Database Error: ' + err.message);
                        }

                        adminGroup.addMember(savedUser._id, function(err, success) {
                            if (err) {
                                winston.error('Database Error: ' + err.message);
                                return next('Database Error: ' + err.message);
                            }

                            if (!success)
                                return next('Unable to add user to Administrator group!');

                            adminGroup.save(function(err) {
                                if (err) {
                                    winston.error('Database Error: ' + err.message);
                                    return next('Database Error: ' + err.message);
                                }

                                return next(null);
                            });
                        });
                    });
                }
            });
        },
        function(next) {
            //Write Configfile
            var fs = require('fs');
            var configFile = path.join(__dirname, '../../config.json');

            var conf = {
                mongo: {
                    host: host,
                    port: port,
                    username: username,
                    password: password,
                    database: database
                }
            };

            fs.writeFile(configFile, JSON.stringify(conf, null, 4), function(err) {
                if (err) {
                    winston.error('FS Error: ' + err.message);
                    return next('FS Error: ' + err.message);
                }

                return next(null);
            });
        }
    ], function(err) {
        if (err)
            return res.status(400).json({success: false, error: err});

        res.json({success: true});
    });
};

installController.restart = function(req, res) {
    var origin = req.headers.origin;
    var host = req.headers.host;
    if (req.secure) host = 'https://' + host;
    if (!req.secure) host = 'http://' + host;

    //Firefox Hack - Firefox Bug 1341689
    //Trudesk Bug #26
    //TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
    if (!origin) origin = host;

    if (origin !== host) return res.status(400).json({success: false, error: 'Invalid Origin!'});

    var pm2 = require('pm2');
    pm2.connect(function(err) {
        if (err) {
            winston.error(err);
            res.status(400).send(err);
            return;
        }
        pm2.restart('trudesk', function(err) {
            if (err) {
                res.status(400).send(err);
                return winston.error(err);
            }

            pm2.disconnect();
            res.send();
        });
    });
};

module.exports = installController;