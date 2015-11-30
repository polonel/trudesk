/*
      .                             .o8                     oooo
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

var async       = require('async'),
    _           = require('underscore'),
    _s          = require('underscore.string'),
    winston     = require('winston'),
    permissions = require('../../../permissions'),
    emitter     = require('../../../emitter'),

    userSchema  = require('../../../models/user'),
    notificationSchema = require('../../../models/notification');


var api_users = {};

/**
 * Inserts a user object
 * @todo Revamp function for newly accesstoken format
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {User|Error} Inserted User Object | Error
 * @deprecated
 */
api_users.create = function(req, res) {
    var data = req.body;

    userSchema.insertUser(data, function(err, r) {
        if (err) {
            winston.warn("Error: " + err.message);
            return res.send(err);
        }

        return res.send(r);
    });
};

/**
 * Updates existing User object based on Id and returns the updated object, once saved to MongoDB.
 * @todo currently being used for **angularjs/profile.js** on updating the user account.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {User|Error} Updated User object | Error
 */
api_users.update = function(req, res) {
    var data = req.body;

    userSchema.getUser(data._id, function(err, user) {
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

            var resUser = StripUserFields(nUser);

            return res.json(resUser);
        });
    });
};

/**
 * @api {put} /api/v1/users/:username/updatepreferences Updates User Preferences
 * @apiName updatePreferences
 * @apiDescription Updates a single user preference.
 * @apiVersion 0.1.0
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X PUT -d "{\"preference\":\"{preference_name}\",\"value\":{value}}" -l http://localhost/api/v1/users/{username}/updatepreferences
 *
 * @apiParamExample {json} Request:
 * {
 *      "preference": "preference_name",
 *      "value": "preference_value"
 * }
 *
 * @apiSuccess {object} user Saved User Object [Stripped]
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_users.updatePreferences = function(req, res) {
    var username = req.params.username;
    if(username == undefined || username == 'undefined')
        return res.status(400).json({error: 'Invalid Request'});

    var data = req.body;
    var preference = data.preference;
    var value = data.value;

    userSchema.getUserByUsername(username, function(err, user) {
        if (err) {
            winston.warn('[API:USERS:UpdatePreferences] Error= ' + err);
            return res.status(400).send(err);
        }

        if (_.isNull(user.preferences))
            user.preferences = {};

        user.preferences[preference] = value;

        user.save(function(err, user) {
            if (err) {
                winston.warn('[API:USERS:UpdatePreferences] Error= ' + err);
                return res.status(400).send(err);
            }

            var resUser = StripUserFields(user);

            return res.json(resUser);
        });
    })
};

/**
 * @api {delete} /api/v1/users/:username Delete User
 * @apiName deleteUser
 * @apiDescription Deletes the giving user via username
 * @apiVersion 0.1.0
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:username
 *
 * @apiSuccess {boolean}     success    Was the user successfully deleted.
 *
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_users.deleteUser = function(req, res) {
    var username = req.params.username;
    if(_.isUndefined(username)) return res.status(400).json({error: 'Invalid Request'});

    userSchema.getUserByUsername(username, function(err, user) {
        if (err) return res.status(400).json({error: err.message});

        if (_.isUndefined(user) || _.isNull(user)) return res.status(400).json({error: 'Invalid Request'});

        if (!permissions.canThis(user.role, 'users:delete')) return res.status(401).json({error: 'Invalid Permissions'});

        user.remove(function(err) {
            if (err) return res.status(400).json({error: err.message});

            res.json({success: true});
        });
    });
};

/**
 * @api {get} /api/v1/users/:username Get User
 * @apiName getUser
 * @apiDescription Gets the user via the given username
 * @apiVersion 0.1.0
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:username
 *
 * @apiSuccess {object}     _id                 The MongoDB ID
 * @apiSuccess {string}     username            Username of the User
 * @apiSuccess {string}     fullname            Fullname of the User
 * @apiSuccess {string}     email               Email Address of the User
 * @apiSuccess {string}     role                Assigned Permission Role of the user
 * @apiSuccess {string}     title               Title of the User
 * @apiSuccess {string}     accessToken         Access Token for the user to access the API
 * @apiSuccess {string}     image               Image filename for the user's profile picture
 * @apiSuccess {array}      iOSDeviceTokens     iOS Device Tokens for push notifications
 *
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_users.single = function(req, res) {
    var username = req.params.username;
    if(_.isUndefined(username)) return res.status(400).json({error: 'Invalid Request.'});

    userSchema.getUserByUsername(username, function(err, user) {
        if (err) return res.status(400).json({error: 'Invalid Request.'});

        if (_.isUndefined(user) || _.isNull(user)) return res.status(400).json({error: 'Invalid Request.'});

        user = StripUserFields(user);

        res.json(user);
    });
};

/**
 * @api {get} /api/v1/users/notificationCount Get Notification Count
 * @apiName getNotificationCount
 * @apiDescription Gets the current notification count for the currently logged in user.
 * @apiVersion 0.1.0
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/notificationCount
 *
 * @apiSuccess {string}     count   The Notification Count
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_users.notificationCount = function(req, res) {
    userSchema.getUser(req.user._id, function(err, user) {
        if (err) return res.status(400).json({error: err.message});
        if (!user) return res.status(200).json({count: ''});

        notificationSchema.getUnreadCount(user._id, function(err, count) {
            if (err) return res.status(400).json({error: err.message});

            res.json({count: count.toString()});
        });
    });
};


api_users.generateApiKey = function(req, res) {
    var id = req.params.id;
    if (_.isUndefined(id) || _.isNull(id)) return res.status(400).json({error: 'Invalid Request'});

    userSchema.getUser(id, function(err, user) {
        if (err) return res.status(400).json({error: 'Invalid Request'});

        user.addAccessToken(function(err, token) {
            if (err) return res.status(400).json({error: 'Invalid Request'});

            res.json({token: token});
        });
    });
};

api_users.removeApiKey = function(req, res) {
    var id = req.params.id;
    if (_.isUndefined(id) || _.isNull(id)) return res.status(400).json({error: 'Invalid Request'});

    userSchema.getUser(id, function(err, user) {
        if (err) return res.status(400).json({error: 'Invalid Request'});

        user.removeAccessToken(function(err, user) {
            if (err) return res.status(400).json({error: 'Invalid Request'});

            return res.json({success: true});
        });
    });
};

function StripUserFields(user) {
    user.password = undefined;
    user.accessToken = undefined;
    user.__v = undefined;
    user.role = undefined;
    user.iOSDeviceTokens = undefined;

    return user;
}


module.exports = api_users;