var async = require('async');
var elasticsearch = require('elasticsearch');
var winston = require('winston');
var database = require('../database');

global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,8) + ' [Child:ElasticSearch:' + global.process.pid + ']';
    },
    level: global.env === 'production' ? 'info' : 'verbose'
});

var ES = {};

function setupDatabase(callback) {
    database.init(function(err, db) {
        if (err) return callback(err);

        ES.mongodb = db;

        return callback(null, db);
    }, process.env.MONGODB_URI);
}

function setupClient() {
    ES.esclient = new elasticsearch.Client({
        host: process.env.ELASTICSEARCH_URI
    });
}

function deleteIndex(callback) {
    ES.esclient.indices.exists({
        index: 'trudesk'
    }, function(err, exists) {
        if (err) return callback(err);
        if (exists) {
            ES.esclient.indices.delete({
                index: 'trudesk'
            }, function(err) {
                if (err) return callback(err);

                return callback();
            });
        } else
            return callback();
    });
}

function createIndex(callback) {
    ES.esclient.indices.create({
        index: 'trudesk',
        body: {
            'settings' : {
                'index': {
                    'number_of_replicas': 0
                },
                'analysis' : {
                    'filter' : {
                        'email' : {
                            'type' : 'pattern_capture',
                            'preserve_original' : true,
                            'patterns' : [
                                '([^@]+)',
                                '(\\p{L}+)',
                                '(\\d+)',
                                '@(.+)'
                            ]
                        }
                    },
                    'analyzer' : {
                        'email' : {
                            'tokenizer' : 'uax_url_email',
                            'filter' : [ 'email', 'lowercase',  'unique' ]
                        }
                    }
                }
            },
            mappings: {
                ticket: {
                    properties: {
                        uid: {
                            type: 'text'
                        },
                        comments: {
                            properties: {
                                owner: {
                                    properties: {
                                        email: {
                                            type: 'text',
                                            analyzer: 'email'
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
                                            type: 'text',
                                            analyzer: 'email'
                                        }
                                    }
                                }
                            }
                        },
                        owner: {
                            properties: {
                                email: {
                                    type: 'text',
                                    analyzer: 'email'
                                }
                            }
                        }
                    }
                }
            }
        }
    }, callback);
}

function crawlTickets(callback) {
    var Model = require('../models/ticket');
    var count = 0;
    var startTime = new Date().getTime();
    var stream = Model.find({deleted: false}).populate('owner group comments.owner notes.owner tags priority type').lean().cursor();

    var bulk = [];
    var sendAndEmptyQueue = function() {
        if (bulk.length > 0) {
            ES.esclient.bulk({
                body: bulk,
                timeout: '1m'
            }, function (err) {
                if (err) {
                    process.send({success: false});
                    throw err;
                }
                else
                    winston.debug('Sent ' + bulk.length + ' documents to Elasticsearch!');
            });
        }

        bulk = [];
    };

    stream.on('data', function(doc) {
        count += 1;

        bulk.push({ index: { _index: 'trudesk', _type: 'ticket', _id: doc._id }});
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
                });
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

        if (count % 500 === 1)
            sendAndEmptyQueue();

    })
        .on('err', function(err) {
            winston.error(err);
            // Send Error Occurred - Kill Process
            throw err;
        })
        .on('close', function() {
            winston.debug('Document Count: ' + count);
            winston.debug('Duration is: ' + (new Date().getTime() - startTime));
            sendAndEmptyQueue();

            // Send to Main

            return callback();
        });
}

function rebuild(callback) {
    setupClient();
    async.series([
        function (next) {
            setupDatabase(next);
        },
        function(next) {
            deleteIndex(next);
        },
        function (next) {
            createIndex(next);
        },
        function (next) {
            crawlTickets(next);
        }
    ], function(err) {
        callback(err);
    });
}

(function() {
    setupClient();
    rebuild(function(err) {
       if (err) {
           process.send({success: false, error: err});
           process.kill(0);
       }

       process.send({success: true});
    });
}());