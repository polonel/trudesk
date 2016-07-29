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

var async           = require('async');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var userSchema      = require('../models/user');
var groupSchema     = require('../models/group');
var permissions     = require('../permissions');
var mongoose        = require('mongoose');
var emitter         = require('../emitter');

var accountsController = {};

accountsController.content = {};

accountsController.get = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:view')) {
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.accounts = {};
    self.content.data.page = 2;

    async.waterfall([
        function(callback) {
            userSchema.getUserWithObject({limit: 20}, function(err, results) {
                callback(err, results);
            });

        }, function (users, callback) {
            //return callback(null, users);

            var result = [];
            async.waterfall([
                function(cc) {
                    groupSchema.getAllGroups(function(err, grps) {
                        if (err) return cc(err);
                        var g = grps.slice(0);
                        g.members = undefined;
                        g.sendMailTo = undefined;
                        self.content.data.allGroups = g;
                        cc(null, grps)
                    });
                },
                function(grps, cc) {
                    async.eachSeries(users, function(u, c) {
                        var user = u.toObject();

                        var groups = _.filter(grps, function(g) {
                            return _.any(g.members, function(m) {
                                if (m)
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
        if (err) return res.render('error', {message: err.message, error: err, layout: false});
        self.content.data.accounts = _.sortBy(rr, 'fullname');

        res.render('accounts', self.content);
    });
};

accountsController.profile = function(req, res, next) {
    var user = req.user;
    var backUrl = req.header('Referer') || '/';
    if (_.isUndefined(user)) {
        req.flash('message', 'Permission Denied.');
        winston.warn('Undefined User - /Profile');
        return res.redirect(backUrl);
    }

    var self = this;
    self.content = {};
    self.content.title = "Profile";
    self.content.nav = 'profile';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.account = {};

    async.parallel({
        account: function(callback) {
            userSchema.getUser(req.user._id, function (err, obj) {
                callback(err, obj);
            });
        }
    }, function(err, result) {
        if (err) {
            req.flash('message', err.message);
            winston.warn(err);
            return res.redirect(backUrl);
        }

        self.content.data.account = result.account;

        res.render('subviews/profile', self.content);
    });
};

accountsController.editAccount = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var username = req.params.username;
    if (_.isUndefined(username)) {
        req.flash('message', 'Invalid User.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.account = {};

    async.parallel({
        roles: function (callback) {
            callback(null, permissions.roles);
        },

        groups: function(callback) {
            groupSchema.getAllGroups(function(err, grps) {
                callback(err, grps);
            });
        },

        account: function(callback) {
            userSchema.getUserByUsername(username, function (err, obj) {
                callback(err, obj);
            });
        }
    }, function(err, result) {
        if (err) {
            req.flash('message', err.message);
            winston.warn(err);
            return res.redirect('/accounts');
        }

        self.content.data.account = result.account;
        self.content.data.roles = result.roles;
        result.groups.members = undefined;
        result.groups.sendMailTo = undefined;
        self.content.data.groups = _.sortBy(result.groups, 'name');

        res.render('subviews/editAccount', self.content);
    });
};

accountsController.postEdit = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:edit')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = user;
    self.content.data.common = req.viewdata;

    async.parallel({
        groups: function(callback) {
            var gIds = req.body.aGrps;

            if (!_.isArray(gIds)) {
                gIds = [gIds];
            }
            var aId = req.body.aId;
            groupSchema.getAllGroups(function(err, grps) {
                if (err) return callback(err, null);

                async.each(grps, function(grp, c) {
                    // Adding User to Group
                    if (_.contains(gIds, grp._id.toString())) {
                        grp.addMember(aId, function(err, result) {
                           if (result) {
                               grp.save(function(err) {
                                   if (err) return c(err);
                                   c();
                               })
                           } else {
                               c();
                           }
                        });
                    } else {
                        //Remove User from Group
                        grp.removeMember(aId, function(err, result) {
                            if (result) {
                                grp.save(function (err) {
                                    if (err) return c(err);

                                    c();
                                });
                            } else {
                                c();
                            }
                        });
                    }

                }, function(err) {
                    if (err) return callback(err, null);

                    callback(null, true);
                });
            });
        },

        user: function(callback) {
            userSchema.getUser(req.body.aId, function(err, u) {
                if (err) return callback(err, null);

                u.fullname = req.body.aFullname;
                u.title = req.body.aTitle;
                u.email = req.body.aEmail;
                u.role = req.body.aRole;

                if (!_s.isBlank(req.body.aPass)) {
                    var pass = req.body.aPass;
                    var cPass = req.body.aPassConfirm;

                    if (pass == cPass) {
                        u.password = cPass;
                    }
                }

                u.save(function(err) {
                    if (err) return callback(err, null);

                    callback(null, u);
                })
            })
        }

    }, function(err, results) {
        if (err) return handleError(res, err);
        //if (!res.groups) return handleError(res, {message: 'Unable to Save Groups for User'});

        return res.redirect('/accounts/' + results.user.username);
    });
};

accountsController.createAccount = function(req, res, next) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.accounts = {};

    async.parallel({
        groups: function(callback) {
            groupSchema.getAllGroups(function(err, grps) {
                callback(err, grps);
            });
        },
        roles: function(callback) {
            callback(null, permissions.roles);
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
            if (!_.isUndefined(results.roles)) self.content.data.roles = results.roles;

            res.render('subviews/createAccount', self.content);
        }
    });
};

accountsController.postCreate = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/accounts');
    }

    var self = this;
    self.content = {};
    self.content.title = "Accounts";
    self.content.nav = 'accounts';

    self.content.data = {};
    self.content.data.user = user;
    self.content.data.common = req.viewdata;

    var username = req.body.aUsername;
    var fullname = req.body.aFullname;
    var title = req.body.aTitle;
    var password = req.body.aPass;
    var confirmPass = req.body.aPassConfirm;
    var email = req.body.aEmail;
    var role = req.body.aRole;
    var groups = req.body.aGrps;

    //Todo Error and Resend to correct page
    if (password !== confirmPass) return handleError(res, {message: "Password Mismatch"});

    var User = userSchema;

    var newUser = new User({
        username: username,
        password: password,
        fullname: fullname,
        email: email,
        title: title,
        role: role
    });

    newUser.save(function(err, obj) {
        if (err) return handleError(res, err);
        if (_.isUndefined(obj)) return handleError(res, {message: "Invalid Obj"});

        if (!_.isArray(groups)) {
            groups = [groups];
        }

        async.each(groups, function(g, callback) {
            if (_.isUndefined(g)) return callback(null);

            groupSchema.getGroupById(g, function(err, grp) {
                if (err) return callback(err);
                grp.addMember(obj._id, function(err, success) {
                    if (err) return callback(err);

                    grp.save(function(err) {
                        if (err) return callback(err);
                        callback(null, success);
                    });
                });
            });
        }, function(err) {
            if (err) return handleError(res, err);

            res.redirect('/accounts');
        });
    });
};

accountsController.uploadImage = function(req, res, next) {
    var fs = require('fs');
    var path = require('path');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: (1024*1024) * 3 // 1mb limit
        }
    });

    var object = {}, error;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === '_id') object._id = val;
        if (fieldname === 'username') object.username = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (mimetype.indexOf('image/') == -1) {
            error = {
                status: 500,
                message: 'Invalid File Type'
            };

            return file.resume();
        }

        var savePath = path.join(__dirname, '../../public/uploads/users');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

        object.filePath = path.join(savePath, 'aProfile_' + object.username + path.extname(filename));
        object.filename = 'aProfile_' + object.username + path.extname(filename);
        object.mimetype = mimetype;

        file.on('limit', function() {
            error = {
                status: 500,
                message: 'File too large'
            };

            // Delete the temp file
            //if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath);

            return file.resume();
        });

        file.pipe(fs.createWriteStream(object.filePath));
    });

    busboy.on('finish', function() {
        if (error) return res.status(error.status).send(error.message);

        if (_.isUndefined(object._id) ||
            _.isUndefined(object.username) ||
            _.isUndefined(object.filePath) ||
            _.isUndefined(object.filename)) {

            return res.status(500).send('Invalid Form Data');
        }

        // Everything Checks out lets make sure the file exists and then add it to the attachments array
        if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk');

        userSchema.getUser(object._id, function(err, user) {
            if (err) return handleError(res, err);

            user.image = object.filename;

            user.save(function(err) {
                if (err) return handleError(res, err);

                emitter.emit('trudesk:profileImageUpdate', {userid: user._id, img: user.image});

                return res.status(200).send('/uploads/users/' + object.filename);
            });
        });
    });

    req.pipe(busboy);
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = accountsController;