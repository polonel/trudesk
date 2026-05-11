const elasticsearch = require('../elasticsearch')

global.env = process.env.NODE_ENV || 'production'
;(function () {
  const ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI
  if (!ELASTICSEARCH_URI) return process.send({ error: { message: 'Invalid connection uri' } })

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
