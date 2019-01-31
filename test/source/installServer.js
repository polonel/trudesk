var is = require('../../src/webserver')

describe('installServer.js', function () {
  it('should start install server', function (done) {
    if (is.server.listening) is.server.close()

    is.installServer(function () {
      done()
    })
  })
})
