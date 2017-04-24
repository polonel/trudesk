/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    03/27/2015
 Author:     Chris Brame

 **/

var async           = require('async');
var _               = require('underscore');
var ticketSchema    = require('../models/ticket');
var reports         = require('../models/report');
var permissions     = require('../permissions');

var reportsController = {};

reportsController.content = {};

reportsController.overview = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Overview";
    self.content.nav = 'reports';
    self.content.subnav = 'reports-overview';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.groups = {};

    self.content.data.reports = {};
    async.parallel([
            function(callback) {
                reports.getReportByStatus(2, function(err, objs) {
                    self.content.data.reports.items = objs;
                    self.content.data.reports.count = _.size(objs);
                    callback(err, objs);
                });
            },
            function(callback) {
                var groupSchema = require('../models/group');
                groupSchema.getAllGroupsOfUser(user._id, function(err, grps) {
                    if (err) return callback(err);
                    ticketSchema.getOverdue(grps, function(err, objs) {
                        if (err) return callback(err);

                        var sorted = _.sortBy(objs, 'updated').reverse();

                        self.content.data.reports.overdue = _.first(sorted, 5);
                        callback(null, objs);
                    });
                });
            }
        ],
        function(err) {
            if (err) return handleError(res, err);

            return res.render('subviews/reports/overview', self.content);
        });
};

reportsController.generate = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:create')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = 'Generate Report';
    self.content.nav = 'reports';
    self.content.subnav = 'reports-generate';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    return res.render('subviews/reports/generate', self.content);
};

reportsController.breakdownGroup = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "Group Breakdown";
    self.content.nav = 'reports';
    self.content.subnav = 'reports-breakdown-group';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.groups = {};

    self.content.data.reports = {};

    return res.render('subviews/reports/breakdown_Group', self.content);

};

reportsController.breakdownUser = function(req, res) {
    var user = req.user;
    if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
        req.flash('message', 'Permission Denied.');
        return res.redirect('/');
    }

    var self = this;
    self.content = {};
    self.content.title = "User Breakdown";
    self.content.nav = 'reports';
    self.content.subnav = 'reports-breakdown-user';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.groups = {};

    self.content.data.reports = {};

    return res.render('subviews/reports/breakdown_User', self.content);
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = reportsController;