var ticketSchema    = require('../models/ticket');
var async           = require('async');
var _               = require('lodash');
var flash           = require('connect-flash');
var groupSchema     = require('../models/group');
var typeSchema      = require('../models/tickettype');

var ticketsController = {};

ticketsController.content = {};

ticketsController.get = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                callback(err, grps);
            })
        },
        function(grps, callback) {
            ticketSchema.getTickets(grps, function(err, results) {

                callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        self.content.data.tickets = results;

        res.render('tickets', self.content);
    });
};

ticketsController.create = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Tickets - Create";
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    async.parallel({
        groups: function (callback) {
            groupSchema.getAllGroups(function (err, objs) {
                callback(err, objs);
            });
        },
        types: function(callback) {
            typeSchema.getTypes(function(err, objs) {
                callback(err, objs);
            });
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
            if (!_.isUndefined(results.types)) self.content.data.ticketTypes = results.types;

            res.render('subviews/newticket', self.content);
        }
    });
};

ticketsController.single = function(req, res, next) {
    var self = this;
    var uid = req.params.id;
    self.content = {};
    self.content.title = "Tickets - " + req.params.id;
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.ticket = {};

    ticketSchema.getTicketByUid(uid, function(err, ticket) {
        if (err) return handleError(res, err);
        if (_.isNull(ticket)) return res.redirect('/tickets');

        if (!_.isUndefined(ticket)) {
            self.content.data.ticket = ticket;
            self.content.data.ticket.commentCount = _.size(ticket.comments);
        }

        res.render('subviews/singleticket', self.content);
    });
};

ticketsController.editTicket = function(req, res, next) {
    var self = this;
    var uid = req.params.id;
    self.content = {};
    self.content.title = "Edit Ticket #" + req.params.id;
    self.content.nav = 'tickets';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.ticket = {};

    async.parallel({
        groups: function (callback) {
            groupSchema.getAllGroups(function (err, objs) {
                callback(err, objs);
            });
        },
        types: function(callback) {
            typeSchema.getTypes(function(err, objs) {
                callback(err, objs);
            });
        },
        ticket: function(callback) {
            ticketSchema.getTicketByUid(uid, function(err, ticket) {
                callback(err, ticket);
            });
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;
            if (!_.isUndefined(results.types)) self.content.data.ticketTypes = results.types;
            if (!_.isUndefined(results.ticket)) self.content.data.ticket = results.ticket;

            res.render('subviews/editticket', self.content);
        }
    });
};

ticketsController.submitTicket = function(req, res, next) {
    var Ticket = ticketSchema;
    Ticket.create({
        owner: req.user._id,
        group: req.body.tGroup,
        status: req.body.tStatus,
        date: new Date(),
        updated: new Date(),
        subject: req.body.tSubject,
        issue: req.body.tIssue,
        priority: req.body.tPriority,
        type: req.body.tType

    }, function(err, t) {
        if (err) return handleError(res, err);

        res.redirect('/tickets');
    });
};

ticketsController.postcomment = function(req, res, next) {
    var Comment = require('../models/comment');
    console.log(req.header('Referer'));
    var Ticket = ticketSchema;
    var id = req.body.ticketId;
    var comment = req.body.commentReply;
    var User = req.user;
    //TODO: Error check fields

    Ticket.getTicketById(id, function(err, t) {
        if (err) return handleError(res, err);

        Comment = {
            owner: User._id,
            date: new Date(),
            comment: comment
        };

        t.comments.push(Comment);
        t.save();
        res.status(200);
        res.end();
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = ticketsController;