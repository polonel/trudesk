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

var RELPATH         = '../';

var async           = require('async');
var _               = require('underscore');
var winston         = require('winston');
var userSchema      = require(RELPATH + 'models/user');
var groupSchema     = require(RELPATH + 'models/group');
var permissions     = require(RELPATH + 'permissions');
var emitter         = require(RELPATH + 'emitter');

var accountsController = {};

accountsController.content = {};

accountsController.signup = function(req, res) {
    var settings = require(RELPATH + 'models/setting');
    settings.getSettingByName('allowUserRegistration:enable', function(err, setting) {
        if (err) return handleError(res, err);
        if (setting && setting.value === true) {
            settings.getSettingByName('legal:privacypolicy', function(err, privacyPolicy) {
                if (err) return handleError(res, err);
                var self = accountsController;
                self.content = {};
                self.content.title = "Create Account";
                self.content.layout = false;
                self.content.data = {};

                if (privacyPolicy === null || _.isUndefined(privacyPolicy.value))
                    self.content.data.privacyPolicy = 'No Privacy Policy has been set.';
                else
                    self.content.data.privacyPolicy = privacyPolicy.value;

                return res.render('pub_signup', self.content);
            });
        } else {
            return res.redirect('/');
        }
    });
};

accountsController.get = function(req, res) {
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
                                    return m._id.toString() === user._id.toString();
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

accountsController.profile = function(req, res) {
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
    self.content.data.host = req.hostname;
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

accountsController.uploadImage = function(req, res) {
    var fs = require('fs');
    var path = require('path');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: (1024*1024) * 3 // 3mb limit
        }
    });

    var object = {}, error;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === '_id') object._id = val;
        if (fieldname === 'username') object.username = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (mimetype.indexOf('image/') === -1) {
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