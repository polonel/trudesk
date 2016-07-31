var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();

var is          = require('../../src/webserver');

describe('installServer.js', function() {

  it('should start install server', function(done) {

    is.installServer(function() {
      done();
    });
  });
});
