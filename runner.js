;(function () {
  'use strict'

  var pm2 = require('pm2')
  var path = require('path')

  pm2.connect(true, function (err) {
    if (err) throw err

    pm2.start(
      {
        name: 'trudesk',
        script: path.join(__dirname, '/app.js'),
        output: path.join(__dirname, '/logs/output.log'),
        error: path.join(__dirname, '/logs/output.log'),
        mergeLogs: true
      },
      function (err) {
        if (err) {
          console.log(err)
          throw err
        }

        pm2.disconnect()
      }
    )
  })
})()
