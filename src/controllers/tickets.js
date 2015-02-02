var ticketSchema    = require('../models/ticket');
var async           = require('async');
var _               = require('underscore');
var _s              = require('underscore.string');
var flash           = require('connect-flash');
var groupSchema     = require('../models/group');
var typeSchema      = require('../models/tickettype');
var emitter         = require('../emitter');

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

ticketsController.getByStatus = function(req, res, next) {
    var url = require('url');
    var self = this;
    self.content = {};
    self.content.title = "Tickets";
    self.content.nav = 'tickets';
    self.content.subnav = 'tickets-';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    var pathname = url.parse(req.url).pathname;
    var arr = pathname.split('/');
    var tType = 'new';
    var s  = 0;
    if (_.size(arr) > 2) tType = arr[2];

    switch (tType) {
        case 'new':
            s = 0;
            break;
        case 'open':
            s = 1;
            break;
        case 'pending':
            s = 2;
            break;
        case 'closed':
            s = 3;
            break;
        default:
            s = 0;
            break;
    }

    self.content.subnav += tType;
    //Ticket Data
    self.content.data.tickets = {};
    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUser(req.user._id, function(err, grps) {
                callback(err, grps);
            });
        },
        function(grps, callback) {
            ticketSchema.getTicketsByStatus(grps, s, function(err, results) {

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
    var user = req.user;
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
        if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets');

        if (!_.any(ticket.group.members, user._id)) {
            return res.redirect('/tickets');
        }

        self.content.data.ticket = ticket;
        self.content.data.ticket.priorityname = getPriorityName(ticket.priority);
        self.content.data.ticket.tagsArray = ticket.tags;
        self.content.data.ticket.commentCount = _.size(ticket.comments);

        return res.render('subviews/singleticket', self.content);
    });
};

function getPriorityName(val) {
    var p = '';
    switch(val) {
        case 1:
            p = 'Normal';
            break;
        case 2:
            p = 'Urgent';
            break;
        case 3:
            p = 'Critical';
            break;
    }

    return p;
}

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
    var marked = require('marked');
    var Ticket = ticketSchema;
    var tags = [];
    if (!_.isUndefined(req.body.tTags)) {
        var t = _s.clean(req.body.tTags);
        tags = _.compact(t.split(','));
    }

    Ticket.create({
        owner: req.user._id,
        group: req.body.tGroup,
        status: 0,
        tags: tags,
        date: new Date(),
        subject: req.body.tSubject,
        issue: marked(req.body.tIssue),
        priority: req.body.tPriority,
        type: req.body.tType

    }, function(err, t) {
        if (err) return handleError(res, err);

        //Trigger Event that a ticket was submitted.

        res.redirect('/tickets');
    });
};

ticketsController.postcomment = function(req, res, next) {
    var Comment = require('../models/comment');

    var Ticket = ticketSchema;
    var id = req.body.ticketId;
    var comment = req.body.commentReply;
    var User = req.user;
    //TODO: Error check fields

    Ticket.getTicketById(id, function(err, t) {
        if (err) return handleError(res, err);
        var marked = require('marked');
        Comment = {
            owner: User._id,
            date: new Date(),
            comment: marked(comment)
        };
        t.updated = Date.now();
        t.comments.push(Comment);
        t.save(function (err) {
            if (err) handleError(res, err);

            res.status(200);
            res.end();
        });
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = ticketsController;