var nconf = require('nconf')
nconf.argv().env()
nconf.overrides({
  tokens: {
    secret: 'TestSecretKey',
    expires: 900
  }
})

var is = require('../../src/webserver')

describe('installServer.js', function () {
  it('should start install server', function (done) {
    if (is.server.listening) is.server.close()

    is.installServer(function () {
      done()
    })
  })
})
