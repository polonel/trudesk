/* eslint-disable no-unused-expressions */
var async = require('async')
var expect = require('chai').expect
var request = require('supertest')

describe('ticketsController', function () {
  var authAgent = request.agent('http://localhost:3111')
  var user = {
    'login-username': 'trudesk',
    'login-password': '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW'
  }
  var cookie

  // FIRST!
  before(function (done) {
    cookie = []

    authAgent
      .post('/login')
      .send(user)
      .end(function (err, res) {
        if (err) return done(err)

        done()
      })
  })

  it('/tickets/:status - should return tickets by status', function (done) {
    async.parallel(
      [
        function (next) {
          authAgent
            .get('/tickets/new')
            .withCredentials()
            .send()
            .expect(200)
            .end(function (err) {
              expect(err).to.not.exist

              next()
            })
        },
        function (next) {
          authAgent
            .get('/tickets/open')
            .withCredentials()
            .send()
            .expect(200)
            .end(function (err) {
              expect(err).to.not.exist

              next()
            })
        },
        function (next) {
          authAgent
            .get('/tickets/pending')
            .withCredentials()
            .send()
            .expect(200)
            .end(function (err) {
              expect(err).to.not.exist

              next()
            })
        },
        function (next) {
          authAgent
            .get('/tickets/closed')
            .withCredentials()
            .send()
            .expect(200)
            .end(function (err) {
              expect(err).to.not.exist

              next()
            })
        }
      ],
      done
    )
  })

  it('/tickets/assigned - should get tickets assigned to user', function (done) {
    authAgent
      .get('/tickets/assigned')
      .withCredentials()
      .send()
      .expect(200)
      .end(function (err) {
        if (err) return done(err)

        done()
      })
  })

  it('/tickets/unassigned - should get unassigned tickets', function (done) {
    authAgent
      .get('/tickets/unassigned')
      .withCredentials()
      .send()
      .expect(200)
      .end(function (err) {
        if (err) return done(err)

        done()
      })
  })

  // it('/tickets/{uid} - should return single ticket', function(done) {
  //     authAgent.get('/tickets/1000')
  //         .set('Cookie', cookie)
  //         .end(function(err) {
  //             expect(err).to.not.exist;
  //
  //             done();
  //         });
  // });
})
