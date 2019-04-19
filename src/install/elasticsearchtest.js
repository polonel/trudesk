var elasticsearch = require('../elasticsearch')
var winston = require('winston')

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
      global.process.pid +
      ']'
    )
  },
  level: global.env === 'production' ? 'info' : 'verbose'
})
;(function () {
  var ELATICSEARCH_URI = process.env.ELATICSEARCH_URI
  if (!ELATICSEARCH_URI) return process.send({ error: { message: 'Invalid connection uri' } })

  elasticsearch.testConnection(function (err) {
    if (err) {
      return process.send({ error: err })
      // return process.kill(0);
    }

    return process.send({ success: true })
    // return process.kill(0);
  })

  // database.init(function(e, db) {
  //     if (e) {
  //         process.send({error: e});
  //         return process.kill(0);
  //     }
  //
  //     if (!db) {
  //         process.send({error: {message: 'Unable to open database'}});
  //         return process.kill(0);
  //     }
  //
  //     process.send({success: true});
  //
  // }, CONNECTION_URI, options);
})()
