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
var nconf           = require('nconf');
var winston         = require('winston');
var elasticsearch   = require('elasticsearch');

var ES = {};

function checkConnection(callback) {
    if (!ES.esclient)
        return callback('Client not initialized');

    ES.esclient.ping({
        requestTimeout: 10000
    }, function(err) {
        if (err)
            return callback('Could not connect to Elasticsearch: ' + ES.host);

        return callback();
    });
}

ES.testConnection = function(callback) {
    if (process.env.ELATICSEARCH_URI)
        ES.host = process.env.ELATICSEARCH_URI;
    else
        ES.host = nconf.get('elasticsearch:host') + ':' + nconf.get('elasticsearch:port');

    ES.esclient = new elasticsearch.Client({
        host: ES.host
    });

    checkConnection(callback);
};

ES.init = function(callback) {
    var ENABLED = (!_.isUndefined(nconf.get('elasticsearch:enable'))) ? nconf.get('elasticsearch:enable') : false;
    if (!ENABLED) {
        if (_.isFunction(callback))
            return callback();

        return false;
    }

    winston.debug('Initializing Elasticsearch...');
    if (process.env.ELATICSEARCH_URI)
        ES.host = process.env.ELATICSEARCH_URI;
    else
        ES.host = nconf.get('elasticsearch:host') + ':' + nconf.get('elasticsearch:port');

    ES.esclient = new elasticsearch.Client({
        host: ES.host
    });

    async.series([
        function(next) {
            checkConnection(function(err) {
                if (err)
                    return next(err);

                winston.info('Elasticsearch Running... Connected.');
                return next();
            });
        }
    ], function(err) {
        if (err && _.isFunction(callback))
            return callback(err);
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
                }, function(err, response) {
                    if (err)
                        winston.error(err);
                    else {
                        winston.debug('Starting Crawl...');
                        var userSchema = require('../models/user');
                        userSchema.find({}, function(err, users) {
                            if (err) 
                                winston.error(err);
                             else {
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
                                            if (err) 
                                                winston.error(err);
                                             else 
                                                winston.debug('Sent ' + bulk.length + ' documents to Elasticsearch!');
                                            
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
                                })
                                .on('close', function() {
                                    winston.debug('Document Count: ' + count);
                                    winston.debug('Duration is: ' + (new Date().getTime() - startTime));
                                    sendAndEmptyQueue();
                                });
                            }
                        });
                    }
                });
            }
        }
    });
};

module.exports = ES;