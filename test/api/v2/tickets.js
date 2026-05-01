/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var request = require('supertest')

describe('api/v2/tickets', function () {
  request = request('http://localhost:3111')
  var createdTicketUid
  var createdTicketId

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

  it('GET /api/v2/tickets/info/types - should return ticket info types', function (done) {
    request
      .get('/api/v2/tickets/info/types')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
      })
      .expect(200, done)
  })

  it('GET /api/v2/tickets/status - should return ticket statuses', function (done) {
    request
      .get('/api/v2/tickets/status')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.status)) throw new Error('Expected status array')
        expect(res.body.status.length).to.be.greaterThan(0)
      })
      .expect(200, done)
  })

  it('GET /api/v2/tickets - should return tickets', function (done) {
    request
      .get('/api/v2/tickets')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.tickets)) throw new Error('Expected tickets array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/tickets - should create a ticket', function (done) {
    request
      .get('/api/v2/tickets/info/types')
      .set('Authorization', 'Bearer ' + global.v2token)
      .end(function (err, infoRes) {
        if (err) return done(err)

        request
          .get('/api/v2/groups?type=all')
          .set('Authorization', 'Bearer ' + global.v2token)
          .end(function (err, groupRes) {
            if (err) return done(err)
            const group = groupRes.body.groups && groupRes.body.groups[0]
            if (!group) return done(new Error('No groups available to create ticket'))

            const firstType = infoRes.body.ticketTypes && infoRes.body.ticketTypes[0]
            const firstPriority = infoRes.body.priorities && infoRes.body.priorities[0]

            if (!firstType || !firstPriority) {
              return done(new Error('Missing ticket metadata: ' + JSON.stringify(infoRes.body)))
            }

            request
              .post('/api/v2/tickets')
              .set('Authorization', 'Bearer ' + global.v2token)
              .set('Content-Type', 'application/json')
              .send({
                subject: 'V2 Test Ticket',
                issue: 'This is a v2 test ticket issue',
                type: firstType._id,
                priority: firstPriority._id,
                group: group._id
              })
              .set('Accept', 'application/json')
              .expect(function (res) {
                if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
                if (!res.body.ticket) throw new Error('Expected ticket in response')
                createdTicketUid = res.body.ticket.uid
                createdTicketId = res.body.ticket._id
              })
              .expect(200, done)
          })
      })
  })

  it('GET /api/v2/tickets/:uid - should return a single ticket', function (done) {
    request
      .get('/api/v2/tickets/' + createdTicketUid)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!res.body.ticket) throw new Error('Expected ticket in response')
        expect(res.body.ticket.uid).to.equal(createdTicketUid)
      })
      .expect(200, done)
  })

  it('PUT /api/v2/tickets/:uid - should update a ticket', function (done) {
    request
      .put('/api/v2/tickets/' + createdTicketUid)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ ticket: { subject: 'V2 Updated Ticket' } })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('POST /api/v2/tickets/addcomment - should add a comment', function (done) {
    request
      .post('/api/v2/tickets/addcomment')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ _id: createdTicketId, comment: 'This is a v2 test comment' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('POST /api/v2/tickets/addnote - should add a note', function (done) {
    request
      .post('/api/v2/tickets/addnote')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ ticketid: createdTicketId, note: 'This is a v2 test note' })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('GET /api/v2/tickets/stats/tags - should return top tags', function (done) {
    request
      .get('/api/v2/tickets/stats/tags')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
      })
      .expect(200, done)
  })

  it('GET /api/v2/tickets/stats/:timespan - should return ticket stats', function (done) {
    request
      .get('/api/v2/tickets/stats/30')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
      })
      .expect(200, done)
  })

  it('DELETE /api/v2/tickets/:id - should soft-delete a ticket', function (done) {
    request
      .delete('/api/v2/tickets/' + createdTicketId)
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })

  it('GET /api/v2/tickets/deleted - should return deleted tickets', function (done) {
    request
      .get('/api/v2/tickets/deleted')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success')
        if (!Array.isArray(res.body.deletedTickets)) throw new Error('Expected deletedTickets array')
      })
      .expect(200, done)
  })

  it('POST /api/v2/tickets/deleted/restore - should restore a deleted ticket', function (done) {
    request
      .post('/api/v2/tickets/deleted/restore')
      .set('Authorization', 'Bearer ' + global.v2token)
      .set('Content-Type', 'application/json')
      .send({ _id: createdTicketId })
      .set('Accept', 'application/json')
      .expect(function (res) {
        if (res.body.success !== true) throw new Error('Expected success: ' + JSON.stringify(res.body))
      })
      .expect(200, done)
  })
})
