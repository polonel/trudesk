var ticketSchema    = require('../models/ticket');
var async           = require('async');
var _               = require('lodash');

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


    res.render('tickets', self.content);
};

ticketsController.create = function(req, res, next) {
    var self = this;
    var groupSchema = require('../models/group');
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
        }
    }, function(err, results) {
        if (err) {
            res.render('error', {error: err, message: err.message});
        } else {
            if (!_.isUndefined(results.groups)) self.content.data.groups = results.groups;

            res.render('subviews/newticket', self.content);
        }
    });
};

ticketsController.submitTicket = function(req, res, next) {
    var Ticket = ticketSchema;
    Ticket.create({
        owner: req.user._id,
        group: req.body.tGroup,
        date: new Date(),
        updated: new Date(),
        subject: req.body.tSubject,
        issue: req.body.tIssue

    }, function(err, t) {
        if (err) return handleError(res, err);

        res.redirect('/tickets');
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = ticketsController;