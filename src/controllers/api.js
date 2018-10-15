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
    _ = require('lodash'),
    winston = require('winston'),
    permissions = require('../permissions'),

    userSchema = require('../models/user'),

    //Sub APIs
    apiTicketsV1        = require('./api/v1/tickets'),
    apiTagsV1           = require('./api/v1/tags'),
    apiNoticesV1        = require('./api/v1/notices'),
    apiUsersV1          = require('./api/v1/users'),
    apiMessagesV1       = require('./api/v1/messages'),
    apiGroupsV1         = require('./api/v1/groups'),
    apiReportsV1        = require('./api/v1/reports'),
    apiSettingsV1       = require('./api/v1/settings'),
    apiPluginsV1        = require('./api/v1/plugins'),
    apiElasticsearchV1  = require('./api/v1/elasticsearch');

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
 * @requires {@link Setting}
 *
 */
var apiController = {};
apiController.tickets = apiTicketsV1;
apiController.tags = apiTagsV1;
apiController.notices = apiNoticesV1;
apiController.users = apiUsersV1;
apiController.messages = apiMessagesV1;
apiController.groups = apiGroupsV1;
apiController.reports = apiReportsV1;
apiController.settings = apiSettingsV1;
apiController.plugins = apiPluginsV1;
apiController.elasticsearch = apiElasticsearchV1;

apiController.import = function(req, res) {
    var fs = require('fs');
    var path = require('path');
    var UserModal =  require('../models/user');
    var groupModel = require('../models/group');

    var array = fs.readFileSync(path.join(__dirname, '..', 'import.csv')).toString().split(('\n'));
    var clean = array.filter(function(e){return e;});

    async.eachSeries(clean, function(item, cb) {
        winston.info(item);

        var fields = item.split(',');
        var fullname = fields[0].toString().replace('.', ' ');
        var k = fullname.split(' ');
        var kCap = _.capitalize(k[0]);
        var kCap1 = _.capitalize(k[1]);
        fullname = kCap + ' ' + kCap1;

        var groupName = fields[2].replace('\\r', '');
        groupName = _.trim(groupName);
        var User = new UserModal({
            username: fields[0],
            password: 'Password123',
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

                    if (_.isUndefined(group) || _.isNull(group)) 
                        return next('no group found = ' + groupName);
                    

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
        _.isUndefined(password)) 
        return res.sendStatus(403);
    

    userModel.getUserByUsername(username, function(err, user) {
        if (err) return res.status(401).json({'success': false, 'error': err.message});
        if (!user) return res.status(401).json({'success': false, 'error': 'Invalid User'});

        if (!userModel.validate(password, user.password)) return res.status(401).json({'success': false, 'error': 'Invalid Password'});

        var resUser = _.clone(user._doc);
        delete resUser.resetPassExpire;
        delete resUser.resetPassHash;
        delete resUser.password;
        delete resUser.iOSDeviceTokens;
        delete resUser.tOTPKey;
        delete resUser.__v;
        delete resUser.preferences;

        if (_.isUndefined(resUser.accessToken) || _.isNull(resUser.accessToken))
            return res.status(200).json({'success': false, 'error': 'No API Key assigned to this User.'});

        req.user = resUser;
        res.header('X-Subject-Token', resUser.accessToken);
        return res.json({'success': true, 'accessToken': resUser.accessToken, 'user': resUser});
    });
};

apiController.getLoggedInUser = function(req, res) {
    if (!req.user)
        return res.status(400).json({success: false, error: 'Invalid Auth'});

    var resUser = _.clone(req.user._doc);
    delete resUser.resetPassExpire;
    delete resUser.accessToken;
    delete resUser.resetPassHash;
    delete resUser.password;
    delete resUser.iOSDeviceTokens;
    delete resUser.tOTPKey;
    delete resUser.__v;
    delete resUser.preferences;

    return res.json({success: true, user: resUser});

};

/**
 * Preforms logout
 * {@link User} object.
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
            if (!deviceToken) return callback();
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

        user.addDeviceToken(token, 1, function(err) {
            if (err) return res.status(400).json({error: err.message});

            res.json({success: true, token: token});
        });
    });
};

apiController.devices.testApn = function(req, res) {
    var notification = {};
    notification.title = 'Test Push Notification [trudesk]';

    var userModel = require('../models/user');
    var ticketModel = require('../models/ticket');
    userModel.getUser('5472dbcd925a4d04c80089ee', function(err, user) {
        if (err) {
            winston.warn(err);
            return true;
        }

        notification.owner = user;

        ticketModel.getTicketByUid(1777, function(err, ticket) {
            if (err) {
                winston.warn(err);
                return true;
            }

            notification.data = {};
            notification.data.ticket = ticket;

            var apn = require('../notifications');
            apn.pushNotification(notification);
        });

    });

    return res.send('Sent!');

};

/**
 * @name apiController.roles
 * @description Stores all role/permission related static functions
 * @namespace
 */
apiController.roles = {};

apiController.roles.get = function(req, res) {
    var roles = permissions.roles;
    return res.json(roles);
};

module.exports = apiController;
