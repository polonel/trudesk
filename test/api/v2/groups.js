/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/groups', function () {
  request = request('http://localhost:3111')
  var createdGroupId

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

  it('GET /api/v2/groups - should return all groups', function (done) {
    request
      .get('/api/v2/groups')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.groups)) throw new Error('Expected groups array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/groups - should create a new group', function (done) {
    request
      .post('/api/v2/groups')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Test Group' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
        if (!res.body.group) throw new Error('Expected group in response')
        createdGroupId = res.body.group._id
      })
      .expect(200, done)
  })

  it('PUT /api/v2/groups/:id - should update a group', function (done) {
    request
      .put('/api/v2/groups/' + createdGroupId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Updated Group' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/groups/:id - should delete a group', function (done) {
    request
      .delete('/api/v2/groups/' + createdGroupId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/groups/:id - should error on invalid id', function (done) {
    request
      .delete('/api/v2/groups/000000000000000000000000')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== false) throw new Error('Expected failure for invalid id')
      })
      .expect(400, done)
  })
})
