/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var should = require('chai').should()
var superagent = require('superagent')

describe('sessions', function () {
  var agent = superagent.agent()
  var unauthAgent = superagent.agent()
  var user = {
    'login-username': 'trudesk',
    'login-password': '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW'
  }

  it('should gain a session', function (done) {
    agent
      .post('http://localhost:3111/login')
      .type('json')
      .send(user)
      .end(function (err, res) {
        should.not.exist(err)
        expect(res.status).to.equal(200)
        // expect(res.user).to.exist;

        done()
      })
  })

  it('should be logged in', function (done) {
    agent.get('http://localhost:3111/tickets').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      res.redirects.should.eql([])

      done()
    })
  })

  it('should redirect if logged in', function (done) {
    agent.get('http://localhost:3111/').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      expect(res.text).to.include('<title>Trudesk &middot; Dashboard</title>')

      done()
    })
  })

  it('should redirect on un-auth', function (done) {
    unauthAgent.get('http://localhost:3111/tickets').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      expect(res.text).to.include('<title>Trudesk &middot; Login</title>')

      done()
    })
  })

  it('should redirect to login on /install', function (done) {
    unauthAgent.get('http://localhost:3111/install').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      expect(res.text).to.include('<title>Trudesk &middot; Login</title>')

      done()
    })
  })

  it('should logout', function (done) {
    agent.get('http://localhost:3111/logout').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      res.redirects.should.eql(['http://localhost:3111/'])

      done()
    })
  })

  it('should return Trudesk Version', function (done) {
    agent.get('http://localhost:3111/api/v1/version').end(function (err, res) {
      expect(err).to.not.exist
      expect(res.status).to.equal(200)
      expect(res.text).to.include('version')

      done()
    })
  })
})
