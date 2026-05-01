/* eslint-disable no-unused-expressions */
var async = require('async')
var expect = require('chai').expect
var m = require('mongoose')
var { TicketModel: ticketSchema, GroupModel: groupSchema, PriorityModel: prioritySchema, TicketStatusModel, TicketTypeModel } = require('../../src/models')

describe('ticket.js', function () {
  var testTicketUid

  it('should create ticket', async function () {
    const [priority, newStatus, ticketType] = await Promise.all([
      prioritySchema.findOne({ default: true }).exec(),
      TicketStatusModel.getStatusByUID(0),
      TicketTypeModel.findOne({ name: 'Issue' }).exec()
    ])

    expect(priority).to.be.a('object')
    expect(newStatus).to.be.a('object')
    expect(ticketType).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticketSchema.create(
        {
          owner: m.Types.ObjectId(),
          group: m.Types.ObjectId(),
          status: newStatus._id,
          tags: [],
          date: new Date(),
          subject: 'Dummy Test Subject',
          issue: 'Dummy Test Issue',
          priority: priority._id,
          type: ticketType._id,
          history: []
        },
        function (err, t) {
          if (err) return reject(err)
          expect(t).to.be.a('object')
          expect(t._doc).to.include.keys(
            '_id', 'uid', 'owner', 'group', 'status', 'tags', 'date',
            'subject', 'issue', 'priority', 'type', 'history', 'attachments',
            'comments', 'deleted'
          )
          expect(t.uid).to.be.a('number')
          testTicketUid = t.uid
          resolve()
        }
      )
    })
  })

  it('should set the ticket status to closed then to open', async function () {
    const closedStatus = await TicketStatusModel.getStatusByUID(3)
    expect(closedStatus).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
        if (err) return reject(err)
        expect(ticket).to.be.a('object')

        ticket.setStatus(m.Types.ObjectId(), closedStatus._id, function (err, ticket) {
          if (err) return reject(err)
          expect(ticket.status.toString()).to.equal(closedStatus._id.toString())
          expect(ticket.closedDate).to.exist
          resolve()
        })
      })
    })

    const openStatus = await TicketStatusModel.getStatusByUID(1)
    expect(openStatus).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
        if (err) return reject(err)
        expect(ticket).to.be.a('object')

        ticket.setStatus(m.Types.ObjectId(), openStatus._id, function (err, ticket) {
          if (err) return reject(err)
          expect(ticket.status.toString()).to.equal(openStatus._id.toString())
          expect(ticket.closedDate).to.not.exist
          resolve()
        })
      })
    })
  })

  it('should set assignee to user', async function () {
    const userSchema = require('../../src/models').UserModel
    const user = await userSchema.getByUsername('trudesk')
    expect(user).to.be.a('object')
    expect(user).to.have.property('_id')

    await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
        if (err) return reject(err)
        ticket.setAssignee(user._id, user._id, function (err, ticket) {
          if (err) return reject(err)
          expect(ticket.assignee.toString()).to.equal(user._id.toString())
          resolve()
        })
      })
    })
  })

  it('should set ticket type', async function () {
    const [ticket, type] = await Promise.all([
      new Promise(function (resolve, reject) {
        ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
      }),
      TicketTypeModel.getTypeByName('Issue')
    ])

    expect(type).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticket.setTicketType(m.Types.ObjectId(), type._id, function (err, t) {
        if (err) return reject(err)
        expect(t.type._id.toString()).to.equal(type._id.toString())
        resolve()
      })
    })
  })

  it('should set ticket priority', async function () {
    const priority = await prioritySchema.getByMigrationNum(3)
    expect(priority).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
        if (err) return reject(err)
        ticket.setTicketPriority(m.Types.ObjectId(), priority, function (err, ticket) {
          if (err) return reject(err)
          expect(ticket.priority.name).to.equal('Critical')
          resolve()
        })
      })
    })
  })

  it('should set ticket group', async function () {
    const group = await new groupSchema({ name: 'Test' }).save()
    expect(group).to.be.a('object')

    await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
        if (err) return reject(err)
        ticket.setTicketGroup(m.Types.ObjectId(), group._id, function (err, ticket) {
          if (err) return reject(err)
          expect(ticket.group.name).to.equal('Test')
          resolve()
        })
      })
    })
  })

  it('should clear the ticket assignee', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')
    const updated = await ticket.clearAssignee(m.Types.ObjectId())
    expect(updated.assignee).to.not.exist
  })

  it('should add Comment and Save', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    ticket.comments.push({ owner: m.Types.ObjectId(), date: new Date(), comment: 'This is a comment' })
    ticket.group = m.Types.ObjectId()
    ticket.owner = m.Types.ObjectId()
    ticket.type = m.Types.ObjectId()

    const saved = await ticket.save()
    expect(saved.comments).to.have.length(1)
  })

  it('should update comment', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    var commentId = ticket.comments[0]._id
    expect(commentId).to.exist

    const updated = await ticket.updateComment(m.Types.ObjectId(), commentId, 'This is the new comment text')
    expect(updated.comments[0].comment).to.equal('This is the new comment text')
  })

  it('should remove comment', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    var commentId = ticket.comments[0]._id
    expect(commentId).to.exist

    const updated = await ticket.removeComment(m.Types.ObjectId(), commentId)
    expect(updated.comments).to.have.length(0)
  })

  it('should add Note and Save', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    ticket.notes.push({ owner: m.Types.ObjectId(), date: new Date(), note: 'This is a note' })
    ticket.group = m.Types.ObjectId()
    ticket.owner = m.Types.ObjectId()
    ticket.type = m.Types.ObjectId()

    const saved = await ticket.save()
    expect(saved.notes).to.have.length(1)
  })

  it('should update note', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    var noteId = ticket.notes[0]._id
    expect(noteId).to.exist

    const updated = await ticket.updateNote(m.Types.ObjectId(), noteId, 'This is the new note text')
    expect(updated.notes[0].note).to.equal('This is the new note text')
  })

  it('should remove note', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    var noteId = ticket.notes[0]._id
    expect(noteId).to.exist

    const updated = await ticket.removeNote(m.Types.ObjectId(), noteId)
    expect(updated.notes).to.have.length(0)
  })

  it('should set ticket issue', async function () {
    const ticket = await new Promise(function (resolve, reject) {
      ticketSchema.getTicketByUid(testTicketUid, function (err, t) { err ? reject(err) : resolve(t) })
    })
    expect(ticket).to.be.a('object')

    const updated = await ticket.setIssue(m.Types.ObjectId(), 'This is the new issue text')
    expect(updated.issue).to.equal('<p>This is the new issue text</p>\n')
  })

  it('should get all tickets', async function () {
    const tickets = await ticketSchema.getForCache()
    expect(tickets.length).to.be.greaterThan(0)
  })

  it('should get all tickets for group', function (done) {
    ticketSchema.getTickets([m.Types.ObjectId()], function (err, tickets) {
      expect(err).to.not.exist
      expect(tickets).to.have.length(0)
      done()
    })
  })

  it('should error getting tickets for group', function (done) {
    async.parallel(
      [
        function (cb) {
          ticketSchema.getTickets(undefined, function (err) {
            expect(err).to.exist
            cb()
          })
        },
        function (cb) {
          ticketSchema.getTickets(1, function (err) {
            expect(err).to.exist
            cb()
          })
        }
      ],
      function () { done() }
    )
  })

  it('should get all tickets for group with limit', function (done) {
    // todo Rewrite this with GetTicketsWithObject Test
    return done()
  })

  it('should get all tickets for group by status', async function () {
    const newStatus = await TicketStatusModel.getStatusByUID(0)

    await new Promise(function (resolve, reject) {
      async.parallel(
        [
          function (cb) {
            ticketSchema.getTicketsByStatus([m.Types.ObjectId()], newStatus._id, function (err, tickets) {
              if (err) return reject(err)
              expect(tickets).to.have.length(0)
              cb()
            })
          },
          function (cb) {
            ticketSchema.getTicketsByStatus(undefined, newStatus._id, function (err) {
              expect(err).to.exist
              cb()
            })
          },
          function (cb) {
            ticketSchema.getTicketsByStatus(m.Types.ObjectId(), newStatus._id, function (err) {
              expect(err).to.exist
              cb()
            })
          }
        ],
        function () { resolve() }
      )
    })
  })

  it('should get all tickets by status', async function () {
    const newStatus = await TicketStatusModel.getStatusByUID(0)

    await new Promise(function (resolve, reject) {
      ticketSchema.getAllByStatus(newStatus._id, function (err, tickets) {
        if (err) return reject(err)
        expect(tickets.length).to.be.greaterThan(0)
        resolve()
      })
    })
  })

  it('should get ticket by _id', async function () {
    const ticket = await ticketSchema.getTicketById(m.Types.ObjectId())
    expect(ticket).to.not.exist

    let threw = false
    try {
      await ticketSchema.getTicketById(undefined)
    } catch (err) {
      threw = true
      expect(err).to.exist
    }
    expect(threw).to.be.true
  })

  it('should get tickets by assignee', function (done) {
    async.parallel(
      [
        function (cb) {
          ticketSchema.getAssigned(m.Types.ObjectId(), function (err) {
            expect(err).to.not.exist
            cb()
          })
        },
        function (cb) {
          ticketSchema.getAssigned(undefined, function (err) {
            expect(err).to.exist
            cb()
          })
        }
      ],
      function () { done() }
    )
  })

  // Should be last
  it('should soft delete ticket', function (done) {
    ticketSchema.getTicketByUid(testTicketUid, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      ticketSchema.softDelete(ticket._id, function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket).to.be.a('object')
        expect(ticket.deleted).to.be.true
        done()
      })
    })
  })
})
