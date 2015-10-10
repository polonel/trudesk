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

var async = require('async'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    winston = require('winston'),
    passport = require('passport'),
    permissions = require('../permissions'),
    emitter = require('../emitter'),

    userSchema = require('../models/user'),

    //Sub APIs
    api_tickets_v1 = require('./api/v1/tickets'),
    api_notices_v1 = require('./api/v1/notices'),
    api_users_v1   = require('./api/v1/users');

/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * @namespace
 * @description API Controller
 * @requires {@link Ticket}
 * @requires {@link User}
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link Emitter}
 *
 */
var apiController = {};
apiController.tickets = api_tickets_v1;
apiController.notices = api_notices_v1;
apiController.users = api_users_v1;

apiController.import = function(req, res) {
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

apiController.testPromo = function(req, res) {
    var path                = require('path');
    var mailer              = require('../mailer');
    var emailTemplates      = require('email-templates');
    var templateDir         = path.resolve(__dirname, '..', 'mailer', 'templates');

    emailTemplates(templateDir, function(err, template) {
        if (err) {
            winston.error(err);
        } else {

            template('promo', function(err, html) {
                if (err) {
                    winston.error(err);
                } else {
                    var mailOptions = {
                        from: 'no-reply@trudesk.io',
                        to: 'chris.brame@granvillecounty.org',
                        subject: 'Trudesk Launch',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err, info) {
                        if (err) {
                            winston.warn(err);
                            return res.send(err);
                        }


                        return res.status(200).send('OK');
                    });
                }
            });
        }
    });
};

/**
 * Redirects to login page
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Login View
 */
apiController.index = function(req, res) {
    res.redirect('login');
};

/**
 * Preforms login with username/password and adds
 * an access token to the {@link User} object.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} {@link User} object
 * @see {@link User}
 * @example
 * //Accepts Content-Type:application/json
 * {
 *    username: req.body.username,
 *    password: req.body.password
 * }
 *
 * @example
 * //Object Returned has the following properties removed
 * var resUser = _.clone(user._doc);
 * delete resUser.resetPassExpire;
 * delete resUser.resetPassHash;
 * delete resUser.password;
 * delete resUser.iOSDeviceToken;
 *
 */
apiController.login = function(req, res) {
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

        if (_.isUndefined(resUser.accessToken) || _.isNull(resUser.accessToken))
            return res.status(200).json({'success': false, 'error': 'No API Key assigned to this User.'});

        req.user = resUser;

        //user.addAccessToken(function(err, token) {
        //    if (err) return res.status(401).json({'success': false, 'error': err.message});
        //    if (!token) return res.status(401).json({'success': false, 'error': 'Invalid AccessToken'});

            return res.json({'success': true, 'accessToken': resUser.accessToken, 'user': resUser});
        //});
    });
};

/**
 * Preforms logout and removes accesstoken as well as device token from
 * {@link User} object.
 *
 * @todo Fix so it doesn't error out of the user doesn't have a device token stored.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} Success/Error object
 *
 * @example
 * //Tokens are sent in the HTTP Header
 * var token = req.headers.token;
 * var deviceToken = req.headers.devicetoken;
 */
apiController.logout = function(req, res) {
    var deviceToken = req.headers.devicetoken;
    var user = req.user;

    async.series([
        function(callback) {
            user.removeDeviceToken(deviceToken, 1, function(err) {
                if (err) return callback(err);

                callback();
            });
        }
    ], function(err) {
        if (err) return res.status(400).json({'success': false, 'error': err.message});

        return res.status(200).json({'success': true});
    });
};

/**
 * @name apiController.devices
 * @description Stores all device related functions
 * @namespace
 */
apiController.devices = {};

/**
 * Sets the device token for a given account via access token.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} Json object with token
 * @example
 * //Return
 * {
 *    success: {boolean},
 *    error: {string},
 *    token: {string}
 * }
 */
apiController.devices.setDeviceToken = function(req, res) {
    var accessToken = req.headers.accesstoken;
    var token = req.body.token;

    if (_.isUndefined(accessToken) || _.isNull(accessToken)) return res.status(401).json({error: 'Invalid Access Token'});
    if (_.isUndefined(token) || _.isNull(token)) return res.status(400).json({error: 'Invalid Device Token'});

    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(401).json({error: err.message});
        if (!user) return res.status(401).json({error: 'Unknown User'});

        user.addDeviceToken(token, 1, function(err, u) {
            if (err) return res.status(400).json({error: err.message});

            res.json({success: true, token: token});
        });
    })
};

apiController.devices.testApn = function(req, res, next) {
    var apn = require('apn');
    var options = {
        production: false,
        cert: 'private/cert.pem',
        key: 'private/key.pem',
        passphrase: 'C04251986c'
    };
    var apnConnection = new apn.Connection(options);
    var device = new apn.Device('6bd663ddb6d419d191159cd6f08094b687f2a75cfcb9a208cd38e9b5dbf80b6c');

    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = "chime";
    note.alert = "Test Notification";
    note.payload = {'messageFrom': 'TruDesk Server!'};

    apnConnection.pushNotification(note, device);

    res.send();

};

/**
 * @name apiController.groups
 * @description Stores all group related static functions
 * @namespace
 */
apiController.groups = {};

/**
 * Gets all groups of given user, via access token or currently logged in user account. <br><br>
 * Route: **[get] /api/groups **
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} Array of {@link Group}
 */
apiController.groups.get = function(req, res) {
    var accessToken = req.headers.accesstoken;

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

/**
 * Creates a group object. <br> <br>
 * Route: **[post] /api/groups/create**
 *
 * @todo revamp to support access token
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {Group} Created Group Object
 * @example
 * Group.name = req.body.name;
 * Group.members = req.body.members;
 * Group.sendMailTo = req.body.sendMailTo;
 */
apiController.groups.create = function(req, res) {
    if (_.isUndefined(req.user)) return res.send('Error: Not Currently Logged in.');
    var groupSchema = require('../models/group');
    var Group = new groupSchema();

    Group.name = req.body.name;
    Group.members = req.body.members;
    Group.sendMailTo = req.body.sendMailTo;

    Group.save(function(err, group) {
        if (err) return res.status(400).send('Error: ' + err.message);

        res.status(200).json(group);
    });
};

/**
 * Updates a group object. <br> <br>
 * Route: **[put] /api/groups/:id**
 *
 * @todo revamp to support access token
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {Group} Updated Group Object
 * @example
 * group.name = data.name;
 * group.members = data.members;
 * group.sendMailTo = data.sendMailTo;
 */
apiController.groups.updateGroup = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data) || !_.isObject(data)) return res.status(400).send('Error: Malformated Data.');
    var groupSchema = require('../models/group');
    groupSchema.getGroupById(data.id, function(err, group) {
        if (err) return res.status(400).send('Error: ' + err.message);

        if (_.isUndefined(group.members)) group.members = [];
        if (_.isUndefined(group.sendMailTo)) group.sendMailTo = [];

        if (!_.isArray(data.members) && data.members !== null && !_.isUndefined(data.members)) data.members = [data.members];
        if (!_.isArray(data.sendMailTo) && data.sendMailTo !== null && !_.isUndefined(data.sendMailTo)) data.sendMailTo = [data.sendMailTo];

        group.name = data.name;
        group.members = data.members;
        group.sendMailTo = data.sendMailTo;

        group.save(function(err, g) {
            if (err) return res.status(400).send('Error: ' + err.message);

            res.json(g);
        });
    });
};

/**
 * Deletes a group object. <br> <br>
 * Route: **[delete] /api/groups/:id**
 *
 * @todo revamp to support access token
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} Success/Error Json Object
 */
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

/**
 * @name apiController.roles
 * @description Stores all role/permission related static functions
 * @namespace
 */
apiController.roles = {};

apiController.roles.get = function(req, res, next) {
    var roles = permissions.roles;
    return res.json(roles);
};

/**
 * @name apiController.messsages
 * @description Stores all message related static functions
 * @namespace
 */
apiController.messages = {};


apiController.messages.get = function(req, res, next) {
    var accessToken = req.headers.accesstoken;
    if (_.isUndefined(accessToken) || _.isNull(accessToken)) return res.status(400).json({error: 'Invalid Access Token'});
    userSchema.getUserByAccessToken(accessToken, function(err, user) {
        if (err) return res.status(400).json({error: err.message});
        if (!user) return res.status(401).json({error: 'Unknown User'});

        var limit = req.query.limit;
        var page = req.query.page;
        var folder = req.query.folder;

        var object = {
            owner: user,
            limit: limit,
            page: page,
            folder: folder
        };

        var messageSchema = require('../models/message');

        messageSchema.getMessagesWithObject(object, function(err, results) {
            if (err) return res.status(401).json({error: err.message});

            return res.json(results);
        });
    });
};

apiController.messages.send = function(req, res, next) {
    var accessToken = req.headers.accesstoken;
    var messageData = req.body;

    if (_.isUndefined(accessToken) || _.isNull(accessToken)) {
        var user = req.user;
        if (_.isUndefined(user) || _.isNull(user)) return res.status(401).json({error: 'Invalid Access Token'});

        //if req.user is set
        var messageSchema = require('../models/message');
        var to = messageData.to;
        if (!_.isArray(to)) {
            to = [messageData.to]
        }
        var marked = require('marked');
        var messageText = messageData.message;
        messageText = messageText.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        messageData.message = marked(messageText);

        async.each(to, function(owner, callback) {
            async.parallel([
                function(done) {
                    var message = new messageSchema({
                        owner: owner,
                        from: user._id,
                        subject: messageData.subject,
                        message: messageData.message
                    });

                    message.save(function(err) {
                        done(err);
                    });
                },
                function(done) {
                    //Save to Sent Items
                    var message = new messageSchema({
                        owner: user._id,
                        from: owner,
                        folder: 1,
                        subject: messageData.subject,
                        message: messageData.message
                    });

                    message.save(function(err) {
                        done(err);
                    });
                }
            ], function(err) {
                if (err) return callback(err);
                callback();
            });
        }, function(err) {
            if (err) return res.status(400).json({error: err});

            res.status(200).json({success: true});
        });
    } else {
        //get user by access token
        userSchema.getUserByAccessToken(accessToken, function(err, user) {
            if (err) return res.status(401).json({'error': err.message});
            if (!user) return res.status(401).json({'error': 'Unknown User'});

            var messageSchema = require('../models/message');

        });
    }
};

module.exports = apiController;
