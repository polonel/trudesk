/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/accounts', function () {
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

  it('GET /api/v2/accounts - should return all accounts', function (done) {
    request
      .get('/api/v2/accounts')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.accounts)) throw new Error('Expected accounts array')
      })
      .expect(200, done)
  })

  it('GET /api/v2/login - should return session user', function (done) {
    request
      .get('/api/v2/login')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (!res.body.username) throw new Error('Expected user object in response')
      })
      .expect(200, done)
  })

  it('GET /api/v2/roles - should return all roles', function (done) {
    request
      .get('/api/v2/roles')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.roles)) throw new Error('Expected roles array')
      })
      .expect(200, done)
  })

  it('GET /api/v2/accounts/profile/notifications - should return notifications', function (done) {
    request
      .get('/api/v2/accounts/profile/notifications')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
      })
      .expect(200, done)
  })

  it('POST /api/v2/accounts - should reject missing fields', function (done) {
    request
      .post('/api/v2/accounts')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ aUsername: '' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== false) throw new Error('Expected failure with missing fields')
      })
      .expect(400, done)
  })

  it('POST /api/v2/accounts - should create a new account', function (done) {
    request
      .post('/api/v2/accounts')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({
        username: 'v2testuser',
        password: 'Tr0ubl3d@sk!',
        passwordConfirm: 'Tr0ubl3d@sk!',
        fullname: 'V2 Test User',
        email: 'v2testuser@trudesk.io',
        role: global.userRoleId,
        title: 'Test'
      })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
        if (!res.body.account) throw new Error('Expected account in response')
        global.v2testUserId = res.body.account._id
      })
      .expect(200, done)
  })

  it('PUT /api/v2/accounts/:username - should update account', function (done) {
    request
      .put('/api/v2/accounts/v2testuser')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({
        fullname: 'V2 Updated User',
        email: 'v2updated@trudesk.io',
        role: global.userRoleId,
        title: 'Updated'
      })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })
})
