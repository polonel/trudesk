var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();
var request     = require('supertest');

describe('api.js', function() {

    it('should return 200 (\'/api/tickets/count/year/2015\')', function(done) {
        request(server).get('/api/tickets/count/year/2015')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                expect(res.body).to.have.property('totalCount');
                expect(res.body.totalCount).to.not.equal(null);

                done();
            });

    });

    it('should return a 200 (\'/\')', function(done) {
        request(server).get('/').expect(200, done);
    });

});