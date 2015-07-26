var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();
var request     = require('supertest');

describe('api/api.js', function() {

    it('should return 401 for failed login', function(done) {
        var user = { username: 'test', password: '' };
        request(server).post('/api/login')
            .send(user)
            .expect(401, done);
    });

    it('should login', function(done) {
        var user = { username: 'trudesk', password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW'};
        request(server).post('/api/login')
            .send(user)
            .expect(200, done);
    });

    it('should have access token', function(done) {
        var userSchema = require('../../src/models/user');
        userSchema.getUserByUsername('trudesk', function(err, user) {
            expect(err).to.not.exist;
            expect(user).to.be.a('object');
            expect(user.accessTokens).to.have.length(1);

            done();
        });
    });

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

    it ('should return a 404 error (\'/api/404\')', function(done) {
        request(server).get('/api/404').expect(404, done);
    })

});