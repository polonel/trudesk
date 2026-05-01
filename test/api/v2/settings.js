/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/settings', function () {
  request = request('http://localhost:3111')

  before(function (done) {
    request
      .post('/api/v2/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'trudesk', password: 'trudesk' })
      .end(function (err, res) {
        if (err) return done(err)
        global.v2token = res.body.token
        done()
      })
  })

  it('GET /api/v2/settings/theme - should return theme settings without auth', function (done) {
    request
      .get('/api/v2/settings/theme')
      .set('Accept', 'application/json')
      .expect(200, done)
  })

  it('GET /api/v2/settings - should return all settings for admin', function (done) {
    request
      .get('/api/v2/settings')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!res.body.settings) throw new Error('Expected settings in response')
      })
      .expect(200, done)
  })

  it('PUT /api/v2/settings - should update settings', function (done) {
    request
      .put('/api/v2/settings')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send([{ name: 'gen:sitename', value: 'Trudesk Test' }])
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('GET /api/v2/settings - should reject unauthenticated request', function (done) {
    request
      .get('/api/v2/settings')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err)
        if (res.status !== 401 && res.status !== 403) return done(new Error('Expected 401 or 403, got ' + res.status))
        done()
      })
  })
})
