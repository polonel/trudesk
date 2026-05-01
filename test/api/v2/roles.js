/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/roles', function () {
  request = request('http://localhost:3111')
  var createdRoleId

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

  it('GET /api/v2/roles - should return all roles', function (done) {
    request
      .get('/api/v2/roles')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.roles)) throw new Error('Expected roles array')
        expect(res.body.roles.length).to.be.greaterThan(0)
      })
      .expect(200, done)
  })

  it('POST /api/v2/roles - should create a role', function (done) {
    request
      .post('/api/v2/roles')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Test Role', description: 'A test role', grants: [] })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
        if (!res.body.role) throw new Error('Expected role in response')
        createdRoleId = res.body.role._id
      })
      .expect(200, done)
  })

  it('PUT /api/v2/roles/:id - should update a role', function (done) {
    request
      .put('/api/v2/roles/' + createdRoleId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ name: 'V2 Updated Role', description: 'Updated description', grants: [] })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/roles/:id - should return 501 not implemented', function (done) {
    request
      .delete('/api/v2/roles/' + createdRoleId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(501, done)
  })
})
