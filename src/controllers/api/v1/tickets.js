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

var async           = require('async'),
    _               = require('underscore'),
    _s              = require('underscore.string'),
    moment          = require('moment'),
    winston         = require('winston'),
    permissions     = require('../../../permissions'),
    emitter         = require('../../../emitter'),

    userSchema      = require('../../../models/user');

var api_tickets = {};

/**
 * @api {get} /api/v1/tickets/ Get Tickets
 * @apiName getTickets
 * @apiDescription Gets tickets for the given User
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets
 *
 * @apiSuccess {object}     _id                 The MongoDB ID
 * @apiSuccess {number}     uid                 Unique ID (seq num)
 * @apiSuccess {object}     owner               User
 * @apiSuccess {object}     owner._id           The MongoDB ID of Owner
 * @apiSuccess {string}     owner.username      Username
 * @apiSuccess {string}     owner.fullname      User Full Name
 * @apiSuccess {string}     owner.email         User Email Address
 * @apiSuccess {string}     owner.role          User Permission Role
 * @apiSuccess {string}     owner.title         User Title
 * @apiSuccess {string}     owner.image         User Image Rel Path
 * @apiSuccess {object}     group               Group
 * @apiSuccess {object}     group._id           Group MongoDB ID
 * @apiSuccess {string}     group.name          Group Name
 * @apiSuccess {object}     assignee            User Assigned
 * @apiSuccess {object}     assignee._id        The MongoDB ID of Owner
 * @apiSuccess {string}     assignee.username   Username
 * @apiSuccess {string}     assignee.fullname   User Full Name
 * @apiSuccess {string}     assignee.email      User Email Address
 * @apiSuccess {string}     assignee.role       User Permission Role
 * @apiSuccess {string}     assignee.title      User Title
 * @apiSuccess {string}     assignee.image      User Image Rel Path
 * @apiSuccess {date}       date                Created Date
 * @apiSuccess {date}       updated             Last Updated DateTime
 * @apiSuccess {boolean}    deleted             Deleted Flag
 * @apiSuccess {object}     type                Ticket Type
 * @apiSuccess {object}     type._id            Type MongoDB ID
 * @apiSuccess {string}     type.name           Type Name
 * @apiSuccess {number}     status              Status of Ticket
 * @apiSuccess {number}     prioirty            Prioirty of Ticket
 * @apiSuccess {array}      tags                Array of Tags
 * @apiSuccess {string}     subject             Subject Text
 * @apiSuccess {string}     issue               Issue Text
 * @apiSuccess {date}       closedDate          Date Ticket was closed
 * @apiSuccess {array}      comments            Array of Comments
 * @apiSuccess {array}      attachments         Array of Attachments
 * @apiSuccess {array}      history             Array of History items
 *
 */
api_tickets.get = function(req, res) {
    var limit = req.query.limit;
    var page = req.query.page;
    var assignedSelf = req.query.assignedself;
    var status = req.query.status;
    var user = req.user;

    var object = {
        user: user,
        limit: limit,
        page: page,
        assignedSelf: assignedSelf,
        status: status
    };

    var ticketModel = require('../../../models/ticket');
    var groupModel = require('../../../models/group');

    async.waterfall([
        function(callback) {
            groupModel.getAllGroupsOfUserNoPopulate(user._id, function(err, grps) {
                callback(err, grps);
            })
        },
        function(grps, callback) {
            ticketModel.getTicketsWithObject(grps, object, function(err, results) {

                callback(err, results);
            });
        }
    ], function(err, results) {
        if (err) return res.send('Error: ' + err.message);

        return res.json(results);
    });
};

/**
 * @api {post} /api/v1/tickets/create Create Ticket
 * @apiName createTicket
 * @apiDescription Creates a ticket with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "subject": "Subject",
 *      "issue": "Issue Exmaple",
 *      "owner": {OwnerId},
 *      "group": {GroupId},
 *      "type": {TypeId},
 *      "prioirty": 0-3
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"subject\":\"{subject}\",\"owner\":{ownerId}, group: \"{groupId}\", type: \"{typeId}\", issue: \"{issue}\", prioirty: \"{prioirty}\"}"
 *      -l http://localhost/api/v1/tickets/create
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Saved Ticket Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
        {
            "error": "Invalid Post Data"
        }
 */

api_tickets.create = function(req, res) {
    var response = {};
    response.success = true;

    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({'success': false, error: 'Invalid Post Data'});

    var socketId = _.isUndefined(postData.socketId) ? '' : postData.socketId;
    var tagSchema = require('../../../models/tag');
    //var tags = [];
    //if (!_.isUndefined(postData.tags)) {
    //    var t = _s.clean(postData.tags);
    //    tags = _.compact(t.split(','));
    //}
    //
    //postData.tags = [];
    //_.each(tags, function(tag) {
    //    var Tag = new tagSchema({
    //        name: tag
    //    });
    //
    //    postData.tags.push(Tag);
    //});

    if (_.isUndefined(postData.tags) || _.isNull(postData.tags)) {
        postData.tags = [];
    } else if (!_.isArray(postData.tags)) {
        postData.tags = [postData.tags];
    }

    var HistoryItem = {
        action: 'ticket:created',
        description: 'Ticket was created.',
        owner: req.user._id
    };

    var ticketModel = require('../../../models/ticket');
    var ticket = new ticketModel(postData);
    ticket.owner = req.user._id;
    var marked = require('marked');
    var tIssue = ticket.issue;
    tIssue = tIssue.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
    ticket.issue = marked(tIssue);
    ticket.history = [HistoryItem];
    ticket.subscribers = [req.user._id];

    ticket.save(function(err, t) {
        if (err) {
            response.success = false;
            response.error = err;
            winston.debug(response);
            return res.status(400).json(response);
        }

        emitter.emit('ticket:created', {socketId: socketId, ticket: t});

        response.ticket = t;
        res.json(response);
    });
};

/**
 * @api {get} /api/v1/tickets/:uid Get Single Ticket
 * @apiName singleTicket
 * @apiDescription Gets a ticket with the given UID.
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/1000
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Ticket"
 }
 */
api_tickets.single = function(req, res) {
    var uid = req.params.uid;
    if (_.isUndefined(uid)) return res.status(200).json({'success': false, 'error': 'Invalid Ticket'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketByUid(uid, function(err, ticket) {
        if (err) return res.send(err);

        if (_.isUndefined(ticket)
            || _.isNull(ticket))
            return res.status(200).json({'success': false, 'error': 'Invalid Ticket'});

        return res.json({'success': true, 'ticket': ticket});
    });
};

/**
 * @api {put} /api/v1/tickets/:id Update Ticket
 * @apiName updateTicket
 * @apiDescription Updates ticket via given OID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -X PUT -d "{\"status\": {status},\"group\": \"{group}\"}"
 *      -l http://localhost/api/v1/tickets/{id}
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} ticket Updated Ticket Object
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_tickets.update = function(req, res) {
    var user = req.user;
    if (!_.isUndefined(user) && !_.isNull(user)) {
        var oId = req.params.id;
        var reqTicket = req.body;
        if (_.isUndefined(oId)) return res.status(400).json({success: false, error: "Invalid Post Data"});
        var ticketModel = require('../../../models/ticket');
        ticketModel.getTicketById(oId, function(err, ticket) {
            if (err) return res.status(400).json({success: false, error: "Invalid Post Data"});

            //Check the user has permission to update ticket.
            if (!_.isUndefined(reqTicket.status))
                ticket.status = reqTicket.status;

            if (!_.isUndefined(reqTicket.group))
                ticket.group = reqTicket.group;

            if (!_.isUndefined(reqTicket.closedDate))
                ticket.closedDate = reqTicket.closedDate;

            if (!_.isUndefined(reqTicket.tags) && !_.isNull(reqTicket.tags))
                ticket.tags = reqTicket.tags;

            ticket.save(function(err, t) {
                if (err) return res.send(err.message);

                emitter.emit('ticket:updated', t);

                return res.json({
                    success: true,
                    error: null,
                    ticket: t
                });
            });
        });
    } else {
        return res.status(403).json({success: false, error: "Invalid Access Token"});
    }
};

/**
 * @api {delete} /api/v1/tickets/:id Delete Ticket
 * @apiName deleteTicket
 * @apiDescription Deletes ticket via given OID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/{id}
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 *
 * @apiError InvalidRequest The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_tickets.delete = function(req, res) {
    var oId = req.params.id;
    var user = req.user;

    if (_.isUndefined(oId) || _.isUndefined(user)) return res.status(400).json({success: false, error: "Invalid Post Data"});



    var ticketModel = require('../../../models/ticket');
    ticketModel.softDelete(oId, function(err) {
        if (err) return res.status(400).json({success: false, error: "Invalid Post Data"});

        emitter.emit('ticket:deleted', oId);
        res.json({success: true, error: null});
    });
};

/**
 * @api {post} /api/v1/tickets/addcomment Add Comment
 * @apiName addComment
 * @apiDescription Adds comment to the given Ticket Id
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"comment\":\"{comment}\",\"owner\":{ownerId}, ticketId: \"{ticketId}\"}"
 *      -l http://localhost/api/v1/tickets/addcomment
 *
 * @apiParamExample {json} Request:
 * {
 *      "comment": "Comment Text",
 *      "owner": {OwnerId},
 *      "ticketid": {TicketId}
 * }
 *
 * @apiSuccess {boolean} success Successful
 * @apiSuccess {string} error Error if occurrred
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
api_tickets.postComment = function(req, res) {
    var commentJson = req.body;
    var comment = commentJson.comment;
    var owner = commentJson.ownerId;
    var ticketId = commentJson._id;

    if (_.isUndefined(ticketId)) return res.status(400).json({error: "Invalid Post Data"});
    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, t) {
        if (err) return res.status(400).json({error: "Invalid Post Data"});

        if (_.isUndefined(comment)) return res.status(400).json({error: "Invalid Post Data"});

        var marked = require('marked');
        comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
        var Comment = {
            owner: owner,
            date: new Date(),
            comment: marked(comment)
        };

        t.updated = Date.now();
        t.comments.push(Comment);
        var HistoryItem = {
            action: 'ticket:comment:added',
            description: 'Comment was added',
            owner: owner
        };
        t.history.push(HistoryItem);

        t.save(function(err, tt) {
            if (err) return res.send(err.message);

            ticketModel.populate(tt, 'comments.owner', function(err) {
                if (err) return true;

                emitter.emit('ticket:comment:added', tt, Comment);

                res.json({success: true, error: null, ticket: tt});
            });
        });
    });
};

/**
 * @api {get} /api/v1/tickets/types Get Ticket Types
 * @apiName getTicketTypes
 * @apiDescription Gets all available ticket types.
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/types
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_tickets.getTypes = function(req, res) {
    var ticketType = require('../../../models/tickettype');
    ticketType.getTypes(function(err, types) {
        if (err) return res.status(400).json({error: "Invalid Post Data"});

        res.json(types);
    });
};

/**
 * @api {get} /api/v1/tickets/stats Get Ticket Stats
 * @apiName getTicketStats
 * @apiDescription Gets cached ticket stats
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/stats
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_tickets.getTicketStats = function(req, res) {
    var timespan = 30;
    if (req.params.timespan)
        timespan = req.params.timespan;

    var cache = global.cache;

    if (_.isUndefined(cache))
        return res.status(400).send('Ticket stats are still loading...');

    var obj = {};
    if (timespan == 30) {
        obj.data = cache.get('tickets:overview:e30:graphData');
        obj.closedCount = cache.get('tickets:overview:e30:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:e30:responseTime');
    } else if (timespan == 60) {
        obj.data = cache.get('tickets:overview:e60:graphData');
        obj.closedCount = cache.get('tickets:overview:e60:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:e60:responseTime');
    } else if (timespan == 90) {
        obj.data = cache.get('tickets:overview:e90:graphData');
        obj.closedCount = cache.get('tickets:overview:e90:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:e90:responseTime');
    } else if (timespan == 180) {
        obj.data = cache.get('tickets:overview:e180:graphData');
        obj.closedCount = cache.get('tickets:overview:e180:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:e180:responseTime');
    } else if (timespan == 365) {
        obj.data = cache.get('tickets:overview:e365:graphData');
        obj.closedCount = cache.get('tickets:overview:e365:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:e365:responseTime');
    } else if (timespan == 0) {
        obj.data = cache.get('tickets:overview:lifetime:graphData');
        obj.closedCount = cache.get('tickets:overview:lifetime:closedTickets');
        obj.ticketAvg = cache.get('tickets:overview:lifetime:responseTime');
    }

    obj.mostRequester = cache.get('quickstats:mostRequester');
    obj.mostCommenter = cache.get('quickstats:mostCommenter');
    obj.mostAssignee = cache.get('quickstats:mostAssignee');
    obj.mostActiveTicket = cache.get('quickstats:mostActiveTicket');

    obj.lastUpdated = cache.get('tickets:overview:lastUpdated');

    res.send(obj);
};

/**
 * @api {get} /api/v1/tickets/stats/group/:group Get Ticket Stats For Group
 * @apiName getTicketStatsForGroup
 * @apiDescription Gets live ticket stats for given groupId
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/stats/group/{groupid}
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_tickets.getTicketStatsForGroup = function(req, res) {
    var groupId = req.params.group;
    if (groupId == 0) return res.status(200).json({success: false, error: 'Please Select Group.'});
    if (_.isUndefined(groupId)) return res.status(400).json({success: false, error: 'Invalid Group Id.'});

    var ticketModel = require('../../../models/ticket');
    var data = {};
    var tags = {};
    async.waterfall([
        function(callback) {
            ticketModel.getTickets([groupId], function(err, tickets) {
                if (err) return callback(err);

                var t = [];

                async.each(tickets, function(ticket, cb) {
                    _.each(ticket.tags, function(tag) {
                        t.push(tag.name);
                    });

                    cb();
                }, function() {
                    _.mixin({
                        'sortKeysBy': function (obj, comparator) {
                            var keys = _.sortBy(_.keys(obj), function (key) {
                                return comparator ? comparator(obj[key], key) : key;
                            });

                            return _.object(keys, _.map(keys, function (key) {
                                return obj[key];
                            }));
                        }
                    });

                    tags = _.reduce(t, function(counts, key) {
                        counts[key]++;
                        return counts;
                    }, _.object(_.map(_.uniq(t), function(key) {
                        return [key, 0];
                    })));

                    tags = _.sortKeysBy(tags, function(value, key) {
                        return -value;
                    });

                    callback(null, tickets);
                });
            });
        },
        function(tickets, callback) {
            var today = moment().hour(23).minute(59).second(59);
            var r = {};
            tickets = _.sortBy(tickets, 'date');
            r.recentTickets = _.last(tickets, 5);
            r.closedTickets = _.filter(tickets, function(v) {
                return v.status === 3;
            });

            var firstDate = moment(_.first(tickets).date).subtract(30, 'd');
            var diffDays = today.diff(firstDate, 'days');

            buildGraphData(tickets, diffDays, function(graphData) {
                r.graphData = graphData;

                //Get average Response
                buildAvgResponse(tickets, function(obj) {
                    r.avgResponse = obj.avgResponse;

                    callback(null, r);
                });
            });
        }
    ], function(err, results) {
        if (err) return res.status(400).json({success: false, error: err});

        //data.closedTickets = results.closedTickets;
        data.recentTickets = results.recentTickets;
        data.closedCount = _.size(results.closedTickets);
        data.graphData = results.graphData;
        data.avgResponse = results.avgResponse;
        data.tags = tags;

        return res.json({success: true, data: data});
    });

};

function buildGraphData(arr, days, callback) {
    var graphData = [];
    var today = moment().hour(23).minute(59).second(59);
    var timespanArray = [];
    for (var i=days;i--;) {
        timespanArray.push(i);
    }
    async.eachSeries(timespanArray, function(day, next) {
        var obj = {};
        var d = today.clone().subtract(day, 'd');
        obj.date = d.format('YYYY-MM-DD');

        var $dateCount = _.filter(arr, function(v) {
            return (v.date <= d.toDate() && v.date >= d.clone().subtract(1, 'd').toDate())
        });

        $dateCount = _.size($dateCount);
        obj.value = $dateCount;
        graphData.push(obj);

        next();

    }, function() {
        callback(graphData);
    });
}

function buildAvgResponse(ticketArray, callback) {
    var cbObj = {};
    var $ticketAvg = [];
    async.eachSeries(ticketArray, function (ticket, callback) {
        if (_.isUndefined(ticket.comments) || _.size(ticket.comments) < 1) return callback();

        var ticketDate = moment(ticket.date);
        var firstCommentDate = moment(ticket.comments[0].date);

        var diff = firstCommentDate.diff(ticketDate, 'seconds');
        $ticketAvg.push(diff);

        callback();

    }, function (err) {
        if (err) return c(err);

        var ticketAvgTotal = _($ticketAvg).reduce(function (m, x) {
            return m + x;
        }, 0);
        var tvt = moment.duration(Math.round(ticketAvgTotal / _.size($ticketAvg)), 'seconds').asHours();
        cbObj.avgResponse = Math.floor(tvt);

        callback(cbObj);
    });
}

/**
 * @api {get} /api/v1/tickets/count/tags Get Tags Count
 * @apiName getTagCount
 * @apiDescription Gets cached count of all tags
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/count/tags
 *
 * @apiError InvalidRequest Invalid Post Data
 *
 */
api_tickets.getTagCount = function(req, res) {
    var cache = global.cache;
    var timespan = req.params.timespan;
    if (_.isUndefined(timespan) || _.isNaN(timespan)) timespan = 0;

    if (_.isUndefined(cache))
        return res.status(400).send('Tag stats are still loading...');

    var tags = cache.get('tags:' + timespan + ':usage');

    res.json({success: true, tags: tags});
};



// Removed 4/12/2016 -- v0.1.7
//
//api_tickets.getMonthData = function(req, res) {
//    var ticketModel = require('../../../models/ticket');
//    var data = [];
//    var newData = [];
//    var closedData = [];
//
//    //var dates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
//    var dates = [];
//    for (var i = 0; i < 12; i++) {
//        var _d = new Date();
//        _d.setMonth(_d.getMonth() - i);
//        _d.setDate(1);
//        dates.push(_d);
//    }
//
//    async.series({
//        total: function(cb) {
//            async.forEachSeries(dates, function(value, next) {
//                var d = [];
//                var date = new Date(value);
//                d.push(date);
//                ticketModel.getMonthCount(date, -1, function(err, count) {
//                    if (err) return next(err);
//
//                    d.push(Math.round(count));
//                    var moment = require('moment');
//                    newData.push({'date': moment(date).format('YYYY-MM-DD'), 'value': Number(Math.round(count))});
//                    next();
//                });
//            }, function(err) {
//                if (err) return cb(err);
//
//                cb();
//            });
//        },
//        closed: function(cb) {
//            async.forEachSeries(dates, function(value, next) {
//                var d = [];
//                var date = new Date(value);
//                d.push(date);
//                ticketModel.getMonthCount(value, 3, function(err, count) {
//                    if (err) return next(err);
//
//                    d.push(Math.round(count));
//                    var moment = require('moment');
//                    closedData.push({'date': moment(date).format('YYYY-MM-DD'), 'value': Number(Math.round(count))});
//                    next();
//                });
//            }, function(err) {
//                if (err) return cb(err);
//
//                cb();
//            });
//        }
//    }, function(err, done) {
//        if (err) return res.status(400).send(err);
//
//        data.push(newData);
//        data.push(closedData);
//        res.json(data);
//    });
//};

//api_tickets.getYearData = function(req, res) {
//    var ticketModel = require('../../../models/ticket');
//    var year = req.params.year;
//
//    var returnData = {};
//
//    async.parallel({
//        totalCount: function(next) {
//            ticketModel.getYearCount(year, -1, function(err, count) {
//                if (err) return next(err);
//
//                next(null, count);
//            });
//        },
//
//        closedCount: function(next) {
//            ticketModel.getYearCount(year, 3, function(err, count) {
//                if (err) return next(err);
//
//                next(null, count);
//            });
//        }
//    }, function(err, done) {
//        returnData.totalCount = done.totalCount;
//        returnData.closedCount = done.closedCount;
//
//        res.json(returnData);
//    });
//};

/**
 * @api {get} /api/v1/tickets/count/topgroups/:timespan/:topNum Top Groups Count
 * @apiName getTopTicketGroups
 * @apiDescription Gets the group with the top ticket count and timespan
 * @apiVersion 0.1.7
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/count/topgroups/30/10
 *
 * @apiSuccess {array} items Array with Group name and Count
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */
api_tickets.getTopTicketGroups = function(req, res) {
    var ticketModel = require('../../../models/ticket');
    var top = req.params.top;
    var timespan = req.params.timespan;

    ticketModel.getTopTicketGroups(timespan, top, function(err, items) {
        if (err) return res.status(400).json({error: 'Invalid Request'});

        return res.json({items: items});
    });
};

/**
 * @api {delete} /api/v1/tickets/:tid/attachments/remove/:aid Remove Attachment
 * @apiName removeAttachment
 * @apiDescription Remove Attachemtn with given Attachment ID from given Ticket ID
 * @apiVersion 0.1.0
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/:tid/attachments/remove/:aid
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} ticket Ticket Object
 *
 * @apiError InvalidRequest Invalid Request
 * @apiError InvalidPermissions Invalid Permissions
 */
api_tickets.removeAttachment = function(req, res) {
    var ticketId = req.params.tid;
    var attachmentId = req.params.aid;
    if (_.isUndefined(ticketId) || _.isUndefined(attachmentId)) return res.status(400).json({'error': 'Invalid Attachment'});

    //Check user perm
    var user = req.user;
    if (_.isUndefined(user)) return res.status(400).json({'error': 'Invalid User Auth.'});

    var permissions = require('../../../permissions');
    if (!permissions.canThis(user.role, 'tickets:removeAttachment')) return res.status(401).json({'error': 'Invalid Permissions'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, ticket) {
        if (err) return res.status(400).send('Invalid Ticket Id');
        ticket.getAttachment(attachmentId, function(a) {
            ticket.removeAttachment(user._id, attachmentId, function(err, ticket) {
                if (err) return res.status(400).json({'error': 'Invalid Request.'});

                var fs = require('fs');
                var path = require('path');
                var dir = path.join(__dirname, '../../../../public', a.path);
                if (fs.existsSync(dir)) fs.unlinkSync(dir);

                ticket.save(function(err, t) {
                    if (err) return res.status(400).json({'error': 'Invalid Request.'});

                    res.json({success: true, ticket: t});
                });
            });
        });
    });
};

/**
 * @api {put} /api/v1/tickets/:id/subscribe Subscribe/Unsubscribe
 * @apiName subscribeTicket
 * @apiDescription Subscribe/Unsubscribe user to the given ticket OID
 * @apiVersion 0.1.4
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X PUT -d "{\"user\": {user},\"subscribe\": {boolean}}" -l http://localhost/api/v1/tickets/{id}
 *
 * @apiParamExample {json} Request-Example:
   {
       "user": {user},
       "subscribe": {boolean}
   }
 *
 * @apiSuccess {boolean} success Successfully?
 *
 * @apiError InvalidPostData Invalid Post Data
 */
api_tickets.subscribe = function(req, res) {
    var ticketId = req.params.id;
    var data = req.body;
    if (_.isUndefined(data.user) || _.isUndefined(data.subscribe)) return res.status(400).json({'error': 'Invalid Post Data.'});

    var ticketModel = require('../../../models/ticket');
    ticketModel.getTicketById(ticketId, function(err, ticket) {
        if (err) return res.status(400).json({'error': 'Invalid Ticket Id'});

        async.series([
            function(callback) {
                if (data.subscribe) {
                    ticket.addSubscriber(data.user, function() {
                        callback();
                    });
                } else {
                    ticket.removeSubscriber(data.user, function() {
                        callback();
                    });
                }
            }
        ], function() {
            ticket.save(function(err) {
                if (err) return res.status(400).json({'error': err});

                emitter.emit('ticket:subscribers:update');

                res.json({'success': true});
            });
        });
    });
};

/**
 * @api {post} /api/v1/tickets/addtag Add Ticket Tag
 * @apiName addTag
 * @apiDescription Adds a Ticket Tag
 * @apiVersion 0.1.6
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X POST -d "{\"tag\": {tag}}" -l http://localhost/api/v1/tickets/addtag
 *
 * @apiParamExample {json} Request-Example:
 {
     "tag": {tag}
 }
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} tag Saved Tag
 *
 * @apiError InvalidPostData Invalid Post Data
 */
api_tickets.addTag = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data.tag)) return res.status(400).json({error: 'Invalid Post Data'});

    var tagSchema = require('../../../models/tag');
    var Tag = new tagSchema({
        name: data.tag
    });

    Tag.save(function(err, T) {
        if (err) return res.status(400).json({error: err.message});

        return res.json({success: true, tag: T});
    });
};

/**
 * @api {get} /api/v1/tickets/tags Get Ticket Tags
 * @apiName getTags
 * @apiDescription Gets all ticket tags
 * @apiVersion 0.1.6
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/tags
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} tags Array of Tags
 *
 */
api_tickets.getTags = function(req, res) {
    var tagSchema = require('../../../models/tag');
    tagSchema.getTags(function(err, tags) {
        if (err) return res.status(400).json({success: false, error: err});

        _.each(tags, function(item) {
            item.__v = undefined;
        });

        res.json({success: true, tags: tags});
    });
};

module.exports = api_tickets;