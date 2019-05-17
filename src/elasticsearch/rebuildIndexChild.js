var async = require('async')
var elasticsearch = require('elasticsearch')
var winston = require('winston')
var moment = require('moment-timezone')
var database = require('../database')

global.env = process.env.NODE_ENV || 'production'

winston.setLevels(winston.config.cli.levels)
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: function () {
    var date = new Date()
    return (
      date.getMonth() +
      1 +
      '/' +
      date.getDate() +
      ' ' +
      date.toTimeString().substr(0, 8) +
      ' [Child:ElasticSearch:' +
      process.pid +
      ']'
    )
  },
  level: global.env === 'production' ? 'info' : 'verbose'
})

var ES = {}
ES.indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'trudesk'

function setupTimezone (callback) {
  var settingsSchema = require('../models/setting')
  settingsSchema.getSettingByName('gen:timezone', function (err, setting) {
    if (err) return callback(err)

    var tz = 'UTC'
    if (setting && setting.value) tz = setting.value

    ES.timezone = tz

    return callback(null, tz)
  })
}

function setupDatabase (callback) {
  database.init(function (err, db) {
    if (err) return callback(err)

    ES.mongodb = db

    return callback(null, db)
  }, process.env.MONGODB_URI)
}

function setupClient () {
  ES.esclient = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_URI,
    pingTimeout: 10000,
    maxRetries: 5
  })
}

function deleteIndex (callback) {
  ES.esclient.indices.exists(
    {
      index: ES.indexName
    },
    function (err, exists) {
      if (err) return callback(err)
      if (exists) {
        ES.esclient.indices.delete(
          {
            index: ES.indexName
          },
          function (err) {
            if (err) return callback(err)

            return callback()
          }
        )
      } else return callback()
    }
  )
}

function createIndex (callback) {
  ES.esclient.indices.create(
    {
      index: ES.indexName,
      body: {
        settings: {
          index: {
            number_of_replicas: 0
          },
          analysis: {
            filter: {
              leadahead: {
                type: 'edge_ngram',
                min_gram: 1,
                max_gram: 20
              },
              email: {
                type: 'pattern_capture',
                preserve_original: true,
                patterns: ['([^@]+)', '(\\p{L}+)', '(\\d+)', '@(.+)']
              }
            },
            analyzer: {
              leadahead: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'leadahead']
              },
              email: {
                tokenizer: 'uax_url_email',
                filter: ['email', 'lowercase', 'unique']
              }
            }
          }
        },
        mappings: {
          doc: {
            properties: {
              uid: {
                type: 'text',
                analyzer: 'leadahead',
                search_analyzer: 'standard'
              },
              subject: {
                type: 'text',
                analyzer: 'leadahead',
                search_analyzer: 'standard'
              },
              issue: {
                type: 'text',
                analyzer: 'leadahead',
                search_analyzer: 'standard'
              },
              dateFormatted: {
                type: 'text',
                analyzer: 'leadahead',
                search_analyzer: 'standard'
              },
              comments: {
                properties: {
                  comment: {
                    type: 'text',
                    analyzer: 'leadahead',
                    search_analyzer: 'standard'
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
              },
              notes: {
                properties: {
                  note: {
                    type: 'text',
                    analyzer: 'leadahead',
                    search_analyzer: 'standard'
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
    },
    callback
  )
}

function sendAndEmptyQueue (bulk, callback) {
  if (bulk.length > 0) {
    ES.esclient.bulk(
      {
        body: bulk,
        timeout: '3m'
      },
      function (err) {
        if (err) {
          process.send({ success: false })
          return process.exit()
        } else {
          winston.debug('Sent ' + bulk.length + ' documents to Elasticsearch!')
          if (typeof callback === 'function') return callback()
        }
      }
    )
  } else if (typeof callback === 'function') return callback()

  return []
}

function crawlUsers (callback) {
  var Model = require('../models/user')
  var count = 0
  var startTime = new Date().getTime()
  var stream = Model.find({ deleted: false })
    .lean()
    .cursor()

  var bulk = []

  stream
    .on('data', function (doc) {
      count += 1
      bulk.push({ index: { _index: ES.indexName, _type: 'doc', _id: doc._id } })
      bulk.push({
        datatype: 'user',
        username: doc.username,
        email: doc.email,
        fullname: doc.fullname,
        title: doc.title,
        role: doc.role
      })

      if (count % 200 === 1) bulk = sendAndEmptyQueue(bulk)
    })
    .on('error', function (err) {
      winston.error(err)
      // Send Error Occurred - Kill Process
      throw err
    })
    .on('close', function () {
      winston.debug('Document Count: ' + count)
      winston.debug('Duration is: ' + (new Date().getTime() - startTime))
      bulk = sendAndEmptyQueue(bulk)

      return callback()
    })
}

function crawlTickets (callback) {
  var Model = require('../models/ticket')
  var count = 0
  var startTime = new Date().getTime()
  var stream = Model.find({ deleted: false })
    .populate('owner group comments.owner notes.owner tags priority type')
    .lean()
    .cursor()

  var bulk = []

  stream
    .on('data', function (doc) {
      stream.pause()
      count += 1

      bulk.push({ index: { _index: ES.indexName, _type: 'doc', _id: doc._id } })
      var comments = []
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
        })
      }
      bulk.push({
        datatype: 'ticket',
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
        dateFormatted: moment
          .utc(doc.date)
          .tz(ES.timezone)
          .format('MMMM D YYYY'),
        priority: {
          _id: doc.priority._id,
          name: doc.priority.name,
          htmlColor: doc.priority.htmlColor
        },
        type: { _id: doc.type._id, name: doc.type.name },
        deleted: doc.deleted,
        comments: comments,
        notes: doc.notes,
        tags: doc.tags
      })

      if (count % 200 === 1) bulk = sendAndEmptyQueue(bulk)

      stream.resume()
    })
    .on('err', function (err) {
      winston.error(err)
      // Send Error Occurred - Kill Process
      throw err
    })
    .on('close', function () {
      winston.debug('Document Count: ' + count)
      winston.debug('Duration is: ' + (new Date().getTime() - startTime))
      bulk = sendAndEmptyQueue(bulk, callback)
    })
}

function rebuild (callback) {
  async.series(
    [
      function (next) {
        setupDatabase(next)
      },
      function (next) {
        setupTimezone(next)
      },
      function (next) {
        deleteIndex(next)
      },
      function (next) {
        createIndex(next)
      },
      function (next) {
        crawlTickets(next)
      }
    ],
    function (err) {
      if (err) winston.error(err)

      return callback(err)
    }
  )
}

;(function () {
  setupClient()
  rebuild(function (err) {
    if (err) {
      process.send({ success: false, error: err })
      return process.exit(0)
    }

    //  Kill it in 10sec to offset refresh timers
    setTimeout(function () {
      process.send({ success: true })
      return process.exit()
    }, 6000)
  })
})()
