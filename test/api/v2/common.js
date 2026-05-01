/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/common', function () {
  request = request('http://localhost:3111')

  it('POST /api/v2/login - should reject invalid credentials', function (done) {
    request
      .post('/api/v2/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'trudesk', password: 'wrongpassword' })
      .expect(function (res) {
        if (res.body.success !== false) throw new Error('Expected login failure')
      })
      .expect(401, done)
  })

  it('POST /api/v2/login - should login with valid credentials', function (done) {
    request
      .post('/api/v2/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'trudesk', password: 'trudesk' })
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected login success')
        if (!res.body.token) throw new Error('Expected token in response')
        global.v2token = res.body.token
      })
      .expect(200, done)
  })

  it('GET /api/v2/about/stats - should return stats when authenticated', function (done) {
    request
      .get('/api/v2/about/stats')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success response')
      })
      .expect(200, done)
  })

  it('GET /api/v2/releases - should return releases without auth', function (done) {
    request
      .get('/api/v2/releases')
      .set('Accept', 'application/json')
      .expect(200, done)
  })

  it('GET /api/v2/logout - should logout', function (done) {
    request
      .get('/api/v2/logout')
      .set('Authorization', 'Bearer ' + global.v2token)
      .expect(200, done)
  })
})
