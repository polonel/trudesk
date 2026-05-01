/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var should = require('chai').should()
var superagent = require('superagent')

describe('sessions', function () {
  var agent = superagent.agent()
  var unauthAgent = superagent.agent()

  it('should login and return JSON success', function (done) {
    agent
      .post('http://localhost:3111/login')
      .type('json')
      .send({ 'login-username': 'trudesk', 'login-password': 'trudesk' })
      .end(function (err, res) {
        should.not.exist(err)
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('success', true)
        expect(res.body).to.have.property('redirectUrl')
        done()
      })
  })

  it('should return the SPA shell for authenticated routes', function (done) {
    agent.get('http://localhost:3111/tickets').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      done()
    })
  })

  it('should serve the SPA shell for root route', function (done) {
    agent.get('http://localhost:3111/').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      done()
    })
  })

  it('should serve the SPA shell for unauthenticated routes', function (done) {
    unauthAgent.get('http://localhost:3111/tickets').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      done()
    })
  })

  it('should redirect /install to root', function (done) {
    unauthAgent.get('http://localhost:3111/install').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      done()
    })
  })

  it('should logout and redirect to root', function (done) {
    agent
      .get('http://localhost:3111/logout')
      .redirects(0)
      .end(function (err, res) {
        if (err && err.status) {
          expect(err.status).to.be.oneOf([301, 302])
          expect(err.response.headers.location).to.equal('/')
          return done()
        }
        expect(res.status).to.be.oneOf([301, 302])
        expect(res.headers.location).to.equal('/')
        done()
      })
  })
})
