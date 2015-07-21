var expect = require('chai').expect;
var should = require('chai').should();
var assert = require('chai').assert;

var CONNECTION_URI = 'mongodb://localhost/polonel_trudesk31908899';

describe('Should pass', function() {
    it('will pass', function(done) {
        var db =  require('../src/database');
        db.init(function(err, db) {
          expect(err).to.be.a('undefined');

          done();
        }, CONNECTION_URI);
    });
});
