/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/messages', function () {
  request = request('http://localhost:3111')
  var conversationId

  before(function (done) {
    request
      .post('/api/v2/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'trudesk', password: 'trudesk' })
      .end(function (err, res) {
        if (err) return done(err)
        global.v2token = res.body.token
        request
          .get('/api/v2/login')
          .set('Authorization', 'Bearer ' + global.v2token)
          .end(function (err2, res2) {
            if (err2) return done(err2)
            global.v2currentUserId = res2.body._id
            done()
          })
      })
  })

  it('GET /api/v2/messages/conversations - should return conversations', function (done) {
    request
      .get('/api/v2/messages/conversations')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.conversations)) throw new Error('Expected conversations array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/messages/conversations/start - should start a conversation', function (done) {
    request
      .get('/api/v2/accounts?type=all')
      .set('Authorization', 'Bearer ' + global.v2token)
      .end(function (err, usersRes) {
        if (err) return done(err)
        const users = usersRes.body.accounts || []
        const otherUser = users.find(function (u) { return u.username !== 'trudesk' && !u.deleted })
        if (!otherUser) return done(new Error('No other user found to start conversation'))

        request
          .post('/api/v2/messages/conversations/start')
          .set('Authorization', 'Bearer ' + global.v2token)
          .set('Content-Type', 'application/json')
          .send({ owner: global.v2currentUserId, participants: [global.v2currentUserId, otherUser._id] })
          .set('Accept', 'application/json')
          .expect(function (res) {
            if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
            if (!res.body.conversation) throw new Error('Expected conversation in response')
            conversationId = res.body.conversation._id
          })
          .expect(200, done)
      })
  })

  it('GET /api/v2/messages/conversations/:id - should return a single conversation', function (done) {
    request
      .get('/api/v2/messages/conversations/' + conversationId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!res.body.conversation) throw new Error('Expected conversation in response')
      })
      .expect(200, done)
  })

  it('POST /api/v2/messages/send - should send a message', function (done) {
    request
      .post('/api/v2/messages/send')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ cId: conversationId, owner: global.v2currentUserId, body: 'Hello from v2 test' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/messages/conversations/:id - should delete a conversation', function (done) {
    request
      .delete('/api/v2/messages/conversations/' + conversationId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })
})
