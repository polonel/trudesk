/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

var ticketSchema    = require('../models/ticket');
var async           = require('async');
var path            = require('path');
var _               = require('lodash');
var flash           = require('connect-flash');
var winston         = require('winston');
var groupSchema     = require('../models/group');
var typeSchema      = require('../models/tickettype');
var emitter         = require('../emitter');
var permissions     = require('../permissions');

/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * @namespace
 * @description Controller for each Ticket View
 * @requires {@link Ticket}
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link Emitter}
 *
 * @todo Redo Submit Ticket static function to submit ticket over API only.
 * @todo Redo Post Comment static function to only allow comments over API.
 */
var ticketsController = {};

/**
 * @name ticketsController.content
 * @description Main Content sent to the view
 */
ticketsController.content = {};

ticketsController.pubNewIssue = function(req, res) {
    var settings = require('../models/setting');
    settings.getSettingByName('allowPublicTickets:enable', function(err, setting) {
        if (err) return handleError(res, err);
        if (setting && setting.value === true) {
            settings.getSettingByName('legal:privacypolicy', function(err, privacyPolicy) {
                if (err) return handleError(res, err);

                var content = {};
                content.title = "New Issue";
                content.layout = false;
                content.data = {};
                if (privacyPolicy === null || _.isUndefined(privacyPolicy.value))
                    content.data.privacyPolicy = 'No Privacy Policy has been set.';
                else
                    content.data.privacyPolicy = privacyPolicy.value;

                return res.render('pub_createTicket', content);
            });
        } else {
            return res.redirect('/');
        }
    });
};

/**
 * Get Ticket View based on ticket status
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getByStatus = function(req, res, next) {
    var url = require('url');
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Tickets";
    processor.nav = 'tickets';
    processor.subnav = 'tickets-';
    processor.renderpage = 'tickets';
    processor.pagetype = 'active';
    processor.object = {
        limit: 50,
        page: page,
        status: []
    };

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

    processor.subnav += tType;
    processor.pagetype = tType;
    processor.object.status.push(s);

    req.processor = processor;
    return next();
};

/**
 * Get Ticket View based on ticket active tickets
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getActive = function(req, res, next) {
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Tickets";
    processor.nav = 'tickets';
    processor.subnav = 'tickets-active';
    processor.renderpage = 'tickets';
    processor.pagetype = 'active';
    processor.object = {
        limit: 50,
        page: page,
        status: [0,1,2]
    };

    req.processor = processor;

    return next();
};

/**
 * Get Ticket View based on tickets assigned to a given user
 * _calls ```next()``` to send to processor_
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {callback} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getAssigned = function(req, res, next) {
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Tickets";
    processor.nav = 'tickets';
    processor.subnav = 'tickets-assigned';
    processor.renderpage = 'tickets';
    processor.pagetype = 'assigned';
    processor.object = {
        limit: 50,
        page: page,
        status: [0,1,2],
        assignedSelf: true,
        user: req.user._id
    };

    req.processor = processor;

    return next();
};

/**
 * Get Ticket View based on tickets assigned to a given user
 * _calls ```next()``` to send to processor_
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {callback} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getUnassigned = function(req, res, next) {
    var page = req.params.page;
    if (_.isUndefined(page)) page = 0;

    var processor = {};
    processor.title = "Tickets";
    processor.nav = 'tickets';
    processor.subnav = 'tickets-unassigned';
    processor.renderpage = 'tickets';
    processor.pagetype = 'unassigned';
    processor.object = {
        limit: 50,
        page: page,
        status: [0,1,2],
        unassigned: true,
        user: req.user._id
    };

    req.processor = processor;

    return next();
};

ticketsController.filter = function(req, res, next) {
    var page = req.query.page;
    if (_.isUndefined(page)) page = 0;

    var queryString = req.query;
    var uid = queryString.uid;
    var subject = queryString.fs;
    var issue = queryString.it;
    var dateStart = queryString.ds;
    var dateEnd = queryString.de;
    var status = queryString.st;
    var priority = queryString.pr;
    var groups = queryString.gp;
    var types = queryString.tt;
    var tags = queryString.tag;
    var assignee = queryString.au;

    var rawNoPage = req.originalUrl.replace(new RegExp('[?&]page=[^&#]*(#.*)?$'), '$1')
                                    .replace(new RegExp('([?&])page=[^&]*&'), '$1');

    if (!_.isUndefined(status) && !_.isArray(status)) status = [status];
    if (!_.isUndefined(priority) && !_.isArray(priority)) priority = [priority];
    if (!_.isUndefined(groups) && !_.isArray(groups)) groups = [groups];
    if (!_.isUndefined(types) && !_.isArray(types)) types = [types];
    if (!_.isUndefined(tags) && !_.isArray(tags)) tags = [tags];
    if (!_.isUndefined(assignee) && !_.isArray(assignee)) assignee = [assignee];

    var filter = {
        uid: uid,
        subject: subject,
        issue: issue,
        date: {
            start: dateStart,
            end: dateEnd
        },
        status: status,
        priority: priority,
        groups: groups,
        tags: tags,
        types: types,
        assignee: assignee,
        raw: rawNoPage
    };

    var processor = {};
    processor.title = "Tickets";
    processor.nav = 'tickets';
    processor.renderpage = 'tickets';
    processor.pagetype = 'filter';
    processor.object = {
        limit: 50,
        page: page,
        status: filter.status,
        user: req.user._id,
        filter: filter
    };

    req.processor = processor;

    return next();
};

/**
 * Process the ```req.processor``` object and render the correct view
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 */
ticketsController.processor = function(req, res) {
    var processor = req.processor;
    if (_.isUndefined(processor)) return res.redirect('/');

    var content = {};
    content.title = processor.title;
    content.nav = processor.nav;
    content.subnav = processor.subnav;

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;

    var object = processor.object;
    object.limit = (object.limit === 1) ? 10 : object.limit;

    content.data.filter = object.filter;

    var userGroups = [];

    async.waterfall([
        function(callback) {
            groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, function(err, grps) {
                if (err) return callback(err);
                userGroups = grps;
                if (permissions.canThis(req.user.role, 'ticket:public')) {
                    groupSchema.getAllPublicGroups(function(err, groups) {
                        if (err) return callback(err);
                        userGroups = groups.concat(grps);

                        return callback(null, userGroups);
                    });
                } else
                    return callback(err, userGroups);
            });
        },
        function(grps, callback) {
            ticketSchema.getTicketsWithObject(grps, object, function(err, results) {
                if (err) return callback(err);

                if (!permissions.canThis(req.user.role, 'notes:view')) {
                    _.each(results, function(ticket) {
                        ticket.notes = [];
                    });
                }

                return callback(null, results);
            });
        }
    ], function(err, results) {
        if (err) return handleError(res, err);

        //Ticket Data
        content.data.tickets = results;

        var countObject = {
            status: object.status,
            assignedSelf: object.assignedSelf,
            assignedUserId: object.user,
            unassigned: object.unassigned,
            filter: object.filter
        };

        //Get Pagination
        ticketSchema.getCountWithObject(userGroups, countObject, function(err, totalCount) {
            if (err) return handleError(res, err);

            content.data.pagination = {};
            content.data.pagination.type = processor.pagetype;
            content.data.pagination.currentpage = object.page;
            content.data.pagination.start = (object.page === 0) ? 1 : object.page * object.limit;
            content.data.pagination.end = (object.page === 0) ? object.limit : (object.page*object.limit)+object.limit;
            content.data.pagination.enabled = false;

            content.data.pagination.total = totalCount;
            if (content.data.pagination.total > object.limit)
                content.data.pagination.enabled = true;

            content.data.pagination.prevpage = (object.page === 0) ? 0 : Number(object.page) - 1;
            content.data.pagination.prevEnabled = (object.page !== 0);
            content.data.pagination.nextpage = ((object.page * object.limit) + object.limit <= content.data.pagination.total) ? Number(object.page) + 1 : object.page;
            content.data.pagination.nextEnabled = ((object.page * object.limit) + object.limit <= content.data.pagination.total);
            content.data.user = req.user;

            res.render(processor.renderpage, content);
        });
    });
};

/**
 * Print Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Subviews/PrintTicket View
 */
ticketsController.print = function(req, res) {
    var user = req.user;
    var uid = req.params.id;
    if (isNaN(uid)) {
        return res.redirect('/tickets');
    }
    var content = {};
    content.title = "Tickets - " + req.params.id;
    content.nav = 'tickets';

    content.data = {};
    content.data.user = req.user;
    content.data.common = req.viewdata;
    content.data.ticket = {};

    ticketSchema.getTicketByUid(uid, function(err, ticket) {
        if (err) return handleError(res, err);
        if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets');

        var hasPublic = permissions.canThis(user.role, 'ticket:public');

        if (!_.some(ticket.group.members, user._id)) {
            if (ticket.group.public && hasPublic) {
                //Blank to bypass
            } else {
                winston.warn('User access ticket outside of group - UserId: ' + user._id);
                return res.redirect('/tickets');
            }
        }

        if (!permissions.canThis(user.role, 'notes:view'))
            ticket.notes = [];

        content.data.ticket = ticket;
        content.data.ticket.priorityname = getPriorityName(ticket.priority);
        content.data.ticket.tagsArray = ticket.tags;
        content.data.ticket.commentCount = _.size(ticket.comments);
        content.layout = 'layout/print';

        return res.render('subviews/printticket', content);
    });
};

/**
 * Get Single Ticket view based on UID
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Single Ticket View
 * @see Ticket
 * @example
 * //Content Object
 * content.title = "Tickets - " + req.params.id;
 * content.nav = 'tickets';
 *
 * content.data = {};
 * content.data.user = req.user;
 * content.data.common = req.viewdata;
 *
 * //Ticket Data
 * content.data.ticket = ticket;
 * content.data.ticket.priorityname = getPriorityName(ticket.priority);
 * content.data.ticket.tagsArray = ticket.tags;
 * content.data.ticket.commentCount = _.size(ticket.comments);
 */
ticketsController.single = function(req, res) {
    var user = req.user;
    var uid = req.params.id;
    if (isNaN(uid)) {
        return res.redirect('/tickets');
    }

    var content = {};
    content.title = "Tickets - " + req.params.id;
    content.nav = 'tickets';

    content.data = {};
    content.data.user = user;
    content.data.common = req.viewdata;
    content.data.ticket = {};

    ticketSchema.getTicketByUid(uid, function(err, ticket) {
        if (err) return handleError(res, err);
        if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets');

        var hasPublic = permissions.canThis(user.role, 'ticket:public');
        if (!_.some(ticket.group.members, user._id)) {
            if (ticket.group.public && hasPublic) {
                //Blank to bypass
            } else {
                winston.warn('User access ticket outside of group - UserId: ' + user._id);
                return res.redirect('/tickets');
            }
        }

        if (!permissions.canThis(user.role, 'notes:view'))
            ticket.notes = [];

        content.data.ticket = ticket;
        content.data.ticket.priorityname = ticket.priority.name;

        return res.render('subviews/singleticket', content);
    });
};

/**
 * Converts the Prioirty Int to Readable Name
 * @memberof ticketsController
 * @instance
 * @param {Number} val Int Value of the Prioirty to convert
 * @returns {string} Readable String for Priority
 */
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

//Move to API
ticketsController.postcomment = function(req, res, next) {
    var Ticket = ticketSchema;
    var id = req.body.ticketId;
    var comment = req.body.commentReply;
    var User = req.user;

    //TODO: Error check fields

    Ticket.getTicketById(id, function(err, t) {
        if (err) return handleError(res, err);
        var marked = require('marked');
        comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        var Comment = {
            owner: User._id,
            date: new Date(),
            comment: marked(comment)
        };
        t.updated = Date.now();
        t.comments.push(Comment);
        var HistoryItem = {
            action: 'ticket:comment:added',
            description: 'Comment was added',
            owner: User._id
        };
        t.history.push(HistoryItem);

        async.series({
            subscribers: function(callback) {
                t.addSubscriber(User._id, function (err, _t) {
                    if (err) return callback(err);
                    emitter.emit('ticket:subscriber:update', {user: User._id, subscribe: true});
                    callback();
                });
            },
            save: function (callback) {
                t.save(function (err, tt) {
                    callback(err, tt);
                });
            }
        }, function(err, T) {
            if (err) return handleError(res, err);

            ticketSchema.populate(T.save, 'subscribers comments.owner', function() {
                emitter.emit('ticket:comment:added', T.save, Comment, req.headers.host);

                return res.send(T);
            });
        });
    });
};

ticketsController.uploadAttachment = function(req, res) {
    var fs = require('fs');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: 10*1024*1024 // 10mb limit
        }
    });

    var object = {}, error;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === 'ticketId') object.ticketId = val;
        if (fieldname === 'ownerId') object.ownerId = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        // winston.debug(mimetype);

        if (mimetype.indexOf('image/') === -1 &&
            mimetype.indexOf('text/') === -1 &&
            mimetype.indexOf('audio/mpeg') === -1 &&
            mimetype.indexOf('audio/mp3') === -1 &&
            mimetype.indexOf('audio/wav') === -1 &&
            mimetype.indexOf('application/x-zip-compressed') === -1 &&
            mimetype.indexOf('application/pdf') === -1) {
            error = {
                status: 500,
                message: 'Invalid File Type'
            };

            return file.resume();
        }

        var savePath = path.join(__dirname, '../../public/uploads/tickets', object.ticketId);
        var sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

        object.filePath = path.join(savePath, 'attachment_' + sanitizedFilename);
        object.filename = sanitizedFilename;
        object.mimetype = mimetype;

        if (fs.existsSync(object.filePath)) {
            error = {
                status: 500,
                message: 'File already exists'
            };

            return file.resume();
        }

        file.on('limit', function() {
            error = {
                status: 500,
                message: 'File too large'
            };

            // Delete the temp file
            if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath);

            return file.resume();
        });

        file.pipe(fs.createWriteStream(object.filePath));
    });

    busboy.on('finish', function() {
        if (error) return res.status(error.status).send(error.message);

        if (_.isUndefined(object.ticketId) ||
            _.isUndefined(object.ownerId) ||
            _.isUndefined(object.filePath)) {

            return res.status(400).send('Invalid Form Data');
        }

        // Everything Checks out lets make sure the file exists and then add it to the attachments array
        if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk');

        ticketSchema.getTicketById(object.ticketId, function(err, ticket) {
            if (err) {
                winston.warn(err);
                return res.status(500).send(err.message);
            }

            var attachment = {
                owner: object.ownerId,
                name: object.filename,
                path: '/uploads/tickets/' + object.ticketId + '/attachment_' + object.filename,
                type: object.mimetype
            };
            ticket.attachments.push(attachment);

            var historyItem = {
                action: 'ticket:added:attachment',
                description: 'Attachment ' + object.filename + ' was added.',
                owner: object.ownerId
            };
            ticket.history.push(historyItem);

            ticket.updated = Date.now();
            ticket.save(function(err, t) {
                if (err) {
                    fs.unlinkSync(object.filePath);
                    winston.warn(err);
                    return res.status(500).send(err.message);
                }

                var returnData = {
                    ticket: t
                };

                return res.json(returnData);
            });
        });
    });

    req.pipe(busboy);
};

function handleError(res, err) {
    if (err) {
        winston.warn(err);
        if (!err.status) res.status = 500;
        else res.status = err.status;
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = ticketsController;