/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/tags', function () {
  request = request('http://localhost:3111')
  var createdTagId

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

  it('GET /api/v2/tags/limit - should return tags with limit', function (done) {
    request
      .get('/api/v2/tags/limit')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.tags)) throw new Error('Expected tags array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/tags/create - should create a tag', function (done) {
    request
      .post('/api/v2/tags/create')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ tag: 'v2-test-tag' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
        if (!res.body.tag) throw new Error('Expected tag in response')
        createdTagId = res.body.tag._id
      })
      .expect(200, done)
  })

  it('PUT /api/v2/tags/:id - should update a tag', function (done) {
    request
      .put('/api/v2/tags/' + createdTagId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'v2-updated-tag' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/tags/:id - should delete a tag', function (done) {
    request
      .delete('/api/v2/tags/' + createdTagId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })
})
