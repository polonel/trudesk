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
    groupSchema = require('../../../models/group'),
    notificationSchema = require('../../../models/notification');


var api_users = {};

api_users.getWithLimit = function(req, res) {
    var limit = req.query.limit;
    var page = req.query.page;
    var search = req.query.search;

    var obj = {
        limit: limit,
        page: page,
        search: search
    };

    async.waterfall([
        function(callback) {
            userSchema.getUserWithObject(obj, function(err, results) {
                callback(err, results);
            });

        }, function (users, callback) {
            var result = [];
            async.waterfall([
                function(cc) {
                    groupSchema.getAllGroups(function(err, grps) {
                        if (err) return cc(err);
                        cc(null, grps)
                    });
                },
                function(grps, cc) {
                    async.eachSeries(users, function(u, c) {
                        var user = u.toObject();

                        var groups = _.filter(grps, function(g) {
                            return _.any(g.members, function(m) {
                                return m._id.toString() == user._id.toString();
                            });
                        });

                        user.groups = _.pluck(groups, 'name');

                        result.push(user);
                        c();
                    }, function(err) {
                        if (err) return callback(err);
                        cc(null, result);
                    });
                }
            ], function(err, results) {
                if (err) return callback(err);
                callback(null, results);
            });
        }
    ], function(err, rr) {
        if (err) return res.status(400).json({error: 'Error: ' + err.message});

        return res.json({success: true, count: _.size(rr), users: rr});
    });
};

/**
 * @api {post} /api/v1/users/create Create Account
 * @apiName createAccount
 * @apiDescription Creates an account with the given post data.
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "aUsername":    "user.name",
 *      "aPass":        "password",
 *      "aPassConfirm": "password",
 *      "aFullname":    "fullname",
 *      "aEmail":       "email@email.com",
 *      "aRole":        {RoleId},
 *      "aTitle":       "User Title",
 *      "aGrps":        [{GroupId}]
 * }
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} account Saved Account Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_users.create = function(req, res) {
    var response = {};
    response.success = true;

    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({'success': false, error: 'Invalid Post Data'});

    if (_.isUndefined(postData.aGrps) || _.isNull(postData.aGrps) || !_.isArray(postData.aGrps))
        return res.status(400).json({success: false, error: 'Invalid Group Array'});

    if (postData.aPass !== postData.aPassConfirm) return res.status(400).json({success: false, error: 'Invalid Password Match'});

    var account = new userSchema({
        username:   postData.aUsername,
        password:   postData.aPass,
        fullname:   postData.aFullname,
        email:      postData.aEmail,
        role:       postData.aRole,
        title:      postData.aTitle
    });

    account.save(function(err, a) {
        if (err) {
           response.success = false;
           response.error = err;
           winston.debug(response);
           return res.status(400).json(response);
        }

        response.account = a;

        async.each(postData.aGrps, function(id, done) {
            if (_.isUndefined(id)) return done(null);
            groupSchema.getGroupById(id, function(err, grp) {
                if (err) return done(err);
                grp.addMember(a._id, function(err, success) {
                    if (err) return done(err);

                    grp.save(function(err) {
                        if (err) return done(err);
                        done(null, success);
                    });
                });
            });

        }, function(err) {
            if (err) return res.status(400).json({success: false, error: err});
            return res.json(response)
        });
    });
};

/**
 * @api {put} /api/v1/users/:username Update User
 * @apiName updateUser
 * @apiDescription Updates a single user.
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiParamExample {json} Request:
 * {
        aId:            {{_id}},
        aUsername:      {{username}},
        aFullname:      {{fullname}},
        aTitle:         {{title}},
        aPass:          {{password}},
        aPassconfirm:   {{password_confirm}},
        aEmail:         {{email}},
        aRole:          {{role.id}},
        aGrps:          [{{group._id}}]
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
api_users.update = function(req, res) {
    var data = req.body;
    // saveGroups - Profile saving where groups are not sent
    var saveGroups = data.saveGroups;
    var obj = {
        _id:            data.aId,
        username:       data.aUsername,
        fullname:       data.aFullname,
        title:          data.aTitle,
        password:       data.aPass,
        passconfirm:    data.aPassConfirm,
        email:          data.aEmail,
        role:           data.aRole,
        groups:         data.aGrps,
    };

    if (_.isNull(obj.groups) || _.isUndefined(obj.groups))
        obj.groups = [];
    else if (!_.isArray(obj.groups))
        obj.groups = [obj.groups];

    async.parallel({
        user: function(done) {
                userSchema.getUser(obj._id, function (err, user) {
                    if (err) return done(err);

                    if (!_.isUndefined(obj.password) && !_.isEmpty(obj.password) &&
                        !_.isUndefined(obj.passconfirm) && !_.isEmpty(obj.passconfirm))
                            if (obj.password === obj.passconfirm)
                                user.password = obj.password;

                    user.fullname = obj.fullname;
                    if (!_.isUndefined(obj.title)) user.title = obj.title;
                    user.email = obj.email;
                    if (!_.isUndefined(obj.role)) user.role = obj.role;

                    user.save(function (err, nUser) {
                        if (err) return done(err);

                        var resUser = StripUserFields(nUser);

                        done(null, resUser);
                    });
                });
        },
        groups: function (done) {
            if (!saveGroups) return done();
            groupSchema.getAllGroups(function(err, groups) {
                if (err) return done(err);
                async.each(groups, function(grp, callback) {
                    if (_.contains(obj.groups, grp._id.toString())) {
                        if (grp.isMember(obj._id)) return callback();
                        grp.addMember(obj._id, function (err, result) {
                            if (err) return callback(err);

                            if (result) {
                                grp.save(function(err, savedGroup) {
                                    if (err) return callback(err);
                                    callback();
                                });
                            } else {
                                return callback();
                            }
                        });
                    } else {
                        //Remove Member from group
                        grp.removeMember(obj._id, function(err, result) {
                            if (err) return callback(err);
                            if (result) {
                                grp.save(function(err, savedGroup) {
                                    if (err) return callback(err);

                                    callback();
                                });
                            } else {
                                return callback();

                            }
                        });
                    }
                }, function(err) {
                    if (err) return done(err);

                    done();
                });
            });
        }
    }, function(err, results) {
        if (err) {
            winston.debug(err);
            return res.status(400).json({error: err});
        }

        return res.json({success: true, user: results.user});
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
 * @api {delete} /api/v1/users/:username Delete / Disable User
 * @apiName deleteUser
 * @apiDescription Disables or Deletes the giving user via username
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:username
 *
 * @apiSuccess {boolean}     success    Was the user successfully Deleted or disabled.
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

    async.waterfall([
        function(cb) {
            userSchema.getUserByUsername(username, function(err, user) {
                if (err) return cb(err);

                cb(null, user);
            })
        },
        function(user, cb) {
            var ticketSchema  = require('../../../models/ticket');
            ticketSchema.getTicketsByRequester(user._id, function(err, tickets) {
                if (err) return cb(err);

                var hasTickets = tickets.length > 0;
                return cb(null, hasTickets, user);
            });
        },
        function(hasTickets, user, cb) {
            if (hasTickets) {
                //Disable if the user has tickets

                user.softDelete(function(err) {
                    if (err) return cb(err);

                    //Force logout if Logged in
                    return cb(null, true);
                });

            } else {
                user.remove(function(err) {
                    if (err) return cb(err);

                    return cb(null, false);
                });
            }
        }
    ], function(err, disabled) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true, disabled: disabled});
    });
};

/**
 * @api {get} /api/v1/users/:username/enable Enable User
 * @apiName enableUser
 * @apiDescription Enable the giving user via username
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:username/enable
 *
 * @apiSuccess {boolean}     success    Was the user successfully enabled.
 *
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_users.enableUser = function(req, res) {
    var username = req.params.username;
    if(_.isUndefined(username)) return res.status(400).json({error: 'Invalid Request'});

    userSchema.getUserByUsername(username, function(err, user) {
        if (err) { winston.debug(err); return res.status(400).json({error: err.message}); }

        if (_.isUndefined(user) || _.isNull(user)) return res.status(400).json({error: 'Invalid Request'});

        if (!permissions.canThis(req.user.role, 'accounts:delete')) return res.status(401).json({error: 'Invalid Permissions'});

        user.deleted = false;

        user.save(function(err, user) {
            if (err) return res.status(400).json({error: err.message});

            res.json({success: true});
        })
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

    var response = {
        success: true,
        groups: []
    };

    async.waterfall([
        function(done) {
            userSchema.getUserByUsername(username, function(err, user) {
                if (err) return done(err);

                if (_.isUndefined(user) || _.isNull(user)) return done('Invalid Request');

                user = StripUserFields(user);
                response.user = user;

                done(null, user);
            })
        },
        function(user, done) {
            groupSchema.getAllGroupsOfUserNoPopulate(user._id, function(err, grps) {
                if (err) return done(err);

                response.groups = _.map(grps, function(o) {
                    return o._id;
                });

                done(null, response.groups);
            });
        }
    ], function(err) {
        if (err) return res.status(400).json({error: err});

        res.json(response);
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

/**
 * @api {post} /api/v1/users/:id/generateapikey Generate API Key
 * @apiName generateApiKey
 * @apiDescription Generates an API key for the given user id
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:id/generateapikey
 *
 * @apiSuccess {string}     token   Generated API Key
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
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

/**
 * @api {post} /api/v1/users/:id/removeapikey Removes API Key
 * @apiName removeApiKey
 * @apiDescription Removes API key for the given user id
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:id/generateapikey
 *
 * @apiSuccess {boolean}     success   Successful?
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
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

/**
 * @api {get} /api/v1/getassignees Get Assignees
 * @apiName getassignees
 * @apiDescription Returns a list of assignable users
 * @apiVersion 0.1.7
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/getassignees
 *
 * @apiSuccess {boolean}     success   Successful?
 * @apiSuccess {array}       users     Array of Assignees
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_users.getAssingees = function(req, res) {
    userSchema.getAssigneeUsers(function(err, users) {
        if (err) return res.status(400).json({error: 'Invalid Request'});

        var strippedUsers = [];

        async.each(users, function(user, cb) {
            user = StripUserFields(user);
            strippedUsers.push(user);

            cb();
        }, function() {
            return res.json({success: true, users: strippedUsers});
        });
    });
};

api_users.uploadProfilePic = function(req, res) {
    var fs = require('fs');
    var path = require('path');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: (1024*1024)*3
        }
    });

    var object = {}, error;

    if (_.isUndefined(req.params.username)) return res.status(400).json({error: 'Invalid Username'});
    object.username = req.params.username;

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (mimetype.indexOf('image/') == -1) {
            error = {
                status: 400,
                message: 'Invalid file type'
            };

            return file.resume();
        }

        var savePath = path.join(__dirname, '../../../../public/uploads/users');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

        console.log(filename);
        object.filePath = path.join(savePath, 'aProfile_' + object.username + '.jpg');
        object.filename = 'aProfile_' + object.username + '.jpg';
        object.mimetype = mimetype;

        file.on('limit', function() {
            error = {
                status: 400,
                message: 'File too large'
            };

            return file.resume();
        });

        file.pipe(fs.createWriteStream(object.filePath));
    });

    busboy.on('finish', function() {
        if (error) return res.status(error.status).send(error.message);

        if (_.isUndefined(object.username) ||
            _.isUndefined(object.filePath) ||
            _.isUndefined(object.filename)) {

            return res.status(400).send('Invalid Form Data');
        }

        if (!fs.existsSync(object.filePath)) return res.status(400).send('File failed to save to disk');

        userSchema.getUserByUsername(object.username, function(err, user) {
            if (err) return res.status(400).send(err.message);

            user.image = object.filename;

            user.save(function(err) {
                if (err) return res.status(500).send(err.message);

                emitter.emit('trudesk:profileImageUpdate', {userid: user._id, img: user.image});

                return res.json({success: true, user: StripUserFields(user)});
            });
        });
    });

    req.pipe(busboy);
};

function StripUserFields(user) {
    user.password = undefined;
    user.accessToken = undefined;
    user.__v = undefined;
    //user.role = undefined;
    user.iOSDeviceTokens = undefined;

    return user;
}


module.exports = api_users;