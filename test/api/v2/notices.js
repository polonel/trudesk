/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/notices', function () {
  request = request('http://localhost:3111')
  var createdNoticeId

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

  it('GET /api/v2/notices - should return all notices', function (done) {
    request
      .get('/api/v2/notices')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.notices)) throw new Error('Expected notices array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/notices - should create a notice', function (done) {
    request
      .post('/api/v2/notices')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Test Notice', message: 'This is a test notice' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
        if (!res.body.notice) throw new Error('Expected notice in response')
        createdNoticeId = res.body.notice._id
      })
      .expect(200, done)
  })

  it('PUT /api/v2/notices/:id - should update a notice', function (done) {
    request
      .put('/api/v2/notices/' + createdNoticeId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Updated Notice', message: 'Updated message', color: '#0000FF', fontColor: '#FFFFFF' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('PUT /api/v2/notices/:id/activate - should activate a notice', function (done) {
    request
      .put('/api/v2/notices/' + createdNoticeId + '/activate')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('GET /api/v2/notices/clear - should deactivate all notices', function (done) {
    request
      .get('/api/v2/notices/clear')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/notices/:id - should delete a notice', function (done) {
    request
      .delete('/api/v2/notices/' + createdNoticeId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })
})
