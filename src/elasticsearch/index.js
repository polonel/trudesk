/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    09/08/2018
 Author:     Chris Brame

 **/

var _               = require('lodash');
var async           = require('async');
var winston         = require('winston');
var elasticsearch   = require('elasticsearch');

var ES = {};

ES.init = function() {
    winston.debug('Initializing Elasticsearch...');
    ES.esclient = new elasticsearch.Client({
        host: '192.168.1.221:9200'
    });

    ES.esclient.ping({
        requestTimeout: 10000
    }, function(error) {
        if (error) {
            // winston.error(error);
            winston.warn('Could not connect to Elasticsearch: 192.168.1.221:9200');
            return false;
        } else
            winston.info('Elasticsearch Running... Connected.');
    });

    ES.esclient.indices.exists({
        index: 'trudesk'
    }, function(err, exists) {
        if (err)
            winston.error(err);
        else {
            if (!exists) {
                ES.esclient.indices.create({
                    index: 'trudesk',
                    body: {
                        "settings" : {
                            "analysis" : {
                                "filter" : {
                                    "email" : {
                                        "type" : "pattern_capture",
                                        "preserve_original" : true,
                                        "patterns" : [
                                            "([^@]+)",
                                            "(\\p{L}+)",
                                            "(\\d+)",
                                            "@(.+)"
                                        ]
                                    }
                                },
                                "analyzer" : {
                                    "email" : {
                                        "tokenizer" : "uax_url_email",
                                        "filter" : [ "email", "lowercase",  "unique" ]
                                    }
                                }
                            }
                        },
                        mappings: {
                            ticket: {
                                properties: {
                                    uid: {
                                        type: "text"
                                    },
                                    comments: {
                                        properties: {
                                            owner: {
                                                properties: {
                                                    email: {
                                                        type: "text",
                                                        analyzer: "email"
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    notes: {
                                        properties: {
                                            owner: {
                                                properties: {
                                                    email: {
                                                        type: "text",
                                                        analyzer: "email"
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    owner: {
                                        properties: {
                                            email: {
                                                type: "text",
                                                analyzer: "email"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }, function(err, response) {
                    if (err)
                        winston.error(err);
                    else {
                        winston.debug('Starting Crawl...');
                        var userSchema = require('../models/user');
                        userSchema.find({}, function(err, users) {
                            if (err) {
                                winston.error(err);
                            } else {
                                var body = [];
                                users.forEach(function(user) {
                                    body.push({
                                        index: {
                                            _index: 'trudesk',
                                            _type: 'user',
                                            _id: user._id
                                        }},
                                        {
                                            username: user.username,
                                            id: user._id,
                                            fullname: user.fullname,
                                            email: user.email,
                                            title: user.title,
                                            role: user.role,
                                            deleted: user.delete
                                        }
                                    );
                                });

                                // ES.esclient.bulk({
                                //     index: 'trudesk',
                                //     type: 'user',
                                //     body: body
                                // });

                                var indexName = 'trudesk';
                                var typeName = 'ticket';

                                var Model = require('../models/ticket');
                                var count = 0;
                                var startTime = new Date().getTime();
                                var stream = Model.find({}).populate('owner group comments.owner notes.owner tags priority type').lean().cursor();

                                var bulk = [];
                                var sendAndEmptyQueue = function() {
                                    if (bulk.length > 0) {
                                        ES.esclient.bulk({
                                            body: bulk
                                        }, function (err) {
                                            if (err) {
                                                winston.error(err);
                                            } else {
                                                winston.debug('Sent ' + bulk.length + ' documents to Elasticsearch!');
                                            }
                                        });
                                    }

                                    bulk = [];
                                };

                                stream.on('data', function(doc) {
                                    count += 1;

                                    bulk.push({ index: { _index: indexName, _type: typeName, _id: doc._id }});
                                    var comments = [];
                                    if (doc.comments !== undefined) {
                                        doc.comments.forEach(function (c) {
                                            comments.push({
                                                comment: c.comment,
                                                _id: c._id,
                                                deleted: c.deleted,
                                                date: c.date,
                                                owner: {
                                                    _id: c.owner._id,
                                                    fullname: c.owner.fullname,
                                                    username: c.owner.username,
                                                    email: c.owner.email,
                                                    role: c.owner.role,
                                                    title: c.owner.title
                                                }
                                            })
                                        });
                                    }
                                    bulk.push({
                                        uid: doc.uid,
                                        owner: {
                                            _id: doc.owner._id,
                                            fullname: doc.owner.fullname,
                                            username: doc.owner.username,
                                            email: doc.owner.email,
                                            role: doc.owner.role,
                                            title: doc.owner.title
                                        },
                                        group: {
                                            _id: doc.group._id,
                                            name: doc.group.name
                                        },
                                        status: doc.status,
                                        issue: doc.issue,
                                        subject: doc.subject,
                                        date: doc.date,
                                        priority: {
                                            _id: doc.priority._id,
                                            name: doc.priority.name
                                        },
                                        type: {_id: doc.type._id, name: doc.type.name},
                                        deleted: doc.deleted,
                                        comments: comments,
                                        notes: doc.notes,
                                        tags: doc.tags
                                    });

                                    if (count % 500 === 1) {
                                        sendAndEmptyQueue();
                                    }
                                })
                                .on('err', function(err) {
                                    winston.error(err);
                                })
                                .on('close', function() {
                                    winston.debug('Document Count: ' + count);
                                    winston.debug('Duration is: ' + (new Date().getTime() - startTime));
                                    sendAndEmptyQueue();
                                });


                                // var ticketSchema = require('../models/ticket');
                                // ticketSchema.find({}).limit(100).exec(function(err, tickets) {
                                //     if (err) {
                                //         winston.error(err);
                                //     } else {
                                //         body = [];
                                //         tickets.forEach(function(ticket) {
                                //             ticket.populate('priority owner type comments.owner tags', function(err, ticket) {
                                //                 if (err) {
                                //                     winston.warn(err);
                                //                 } else {
                                //                     body.push({
                                //                             index: {
                                //                                 _index: 'trudesk',
                                //                                 _type: 'ticket',
                                //                                 _id: ticket._id
                                //                             }
                                //                         },
                                //                         {
                                //                             owner: ticket.owner,
                                //                             issue: ticket.issue,
                                //                             subject: ticket.subject,
                                //                             date: ticket.date,
                                //                             priority: ticket.priority,
                                //                             type: {_id: ticket.type._id, name: ticket.type.name},
                                //                             deleted: ticket.deleted,
                                //                             comments: ticket.comments,
                                //                             notes: ticket.notes,
                                //                             tags: ticket.tags
                                //                         }
                                //                     );
                                //
                                //                     ES.esclient.bulk({
                                //                         index: 'trudesk',
                                //                         type: 'ticket',
                                //                         body: body
                                //                     });
                                //                 }
                                //             });
                                //         });
                                //     }
                                // });
                            }
                        });
                    }
                });
            }
        }
    });
};

module.exports = ES;