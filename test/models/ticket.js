/* eslint-disable no-unused-expressions */
var async = require('async')
var expect = require('chai').expect
var m = require('mongoose')
var ticketSchema = require('../../src/models/ticket')
var groupSchema = require('../../src/models/group')
var prioritySchema = require('../../src/models/ticketpriority')

describe('ticket.js', function () {
  // it('should clear collections.', function(done) {
  //    expect(mongoose).to.exist;
  //
  //    dbHelper.clearCollections(mongoose, function(err) {
  //        expect(err).to.not.exist;
  //
  //        done();
  //    });
  // });

  it('should create ticket', function (done) {
    prioritySchema.findOne({ default: true }).exec(function (err, p) {
      expect(err).to.not.exist
      expect(p).to.be.a('object')

      ticketSchema.create(
        {
          owner: m.Types.ObjectId(),
          group: m.Types.ObjectId(),
          status: 0,
          tags: [],
          date: new Date(),
          subject: 'Dummy Test Subject',
          issue: 'Dummy Test Issue',
          priority: p._id,
          type: m.Types.ObjectId(),
          history: []
        },
        function (err, t) {
          expect(err).to.not.exist
          expect(t).to.be.a('object')
          expect(t._doc).to.include.keys(
            '_id',
            'uid',
            'owner',
            'group',
            'status',
            'tags',
            'date',
            'subject',
            'issue',
            'priority',
            'type',
            'history',
            'attachments',
            'comments',
            'deleted'
          )

          expect(t.uid).to.equal(1000)

          done()
        }
      )
    })
  })

  it('should set the ticket status to closed then to open', function (done) {
    async.series(
      [
        function (cb) {
          ticketSchema.getTicketByUid(1000, function (err, ticket) {
            expect(err).to.not.exist
            expect(ticket).to.be.a('object')

            ticket.setStatus(m.Types.ObjectId(), 3, function (err, ticket) {
              expect(err).to.not.exist
              expect(ticket.status).to.equal(3)
              expect(ticket.closedDate).to.exist

              cb()
            })
          })
        },
        function (cb) {
          ticketSchema.getTicketByUid(1000, function (err, ticket) {
            expect(err).to.not.exist
            expect(ticket).to.be.a('object')

            ticket.setStatus(m.Types.ObjectId(), 1, function (err, ticket) {
              expect(err).to.not.exist
              expect(ticket.status).to.equal(1)
              expect(ticket.closedDate).to.not.exist

              cb()
            })
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  it('should set assignee to user', function (done) {
    var userSchema = require('../../src/models/user')
    async.waterfall(
      [
        function (cb) {
          userSchema.getUserByUsername('trudesk', function (err, user) {
            expect(err).to.not.exist
            expect(user).to.be.a('object')
            expect(user).to.have.property('_id')

            cb(null, user._id)
          })
        },
        function (userId, cb) {
          ticketSchema.getTicketByUid(1000, function (err, ticket) {
            expect(err).to.not.exist
            ticket.setAssignee(userId, userId, function (err, ticket) {
              expect(err).to.not.exist
              expect(ticket.assignee).to.equal(userId)

              cb()
            })
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  it('should set ticket type', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      var typeSchema = require('../../src/models/tickettype')
      typeSchema.getTypeByName('Issue', function (err, type) {
        expect(err).to.not.exist
        expect(type).to.be.a('object')
        var ownerId = m.Types.ObjectId()

        ticket.setTicketType(ownerId, type._id, function (err, ticket) {
          expect(err).to.not.exist
          expect(ticket.type._id).to.equal(type._id)

          done()
        })
      })
    })
  })

  it('should set ticket priority', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      var ownerId = m.Types.ObjectId()
      prioritySchema.getByMigrationNum(3, function (err, priority) {
        expect(err).to.not.exist
        expect(priority).to.be.a('object')

        ticket.setTicketPriority(ownerId, priority, function (err, ticket) {
          expect(err).to.not.exist
          expect(ticket.priority.name).to.equal('Critical')

          done()
        })
      })
    })
  })

  it('should set ticket group', function (done) {
    var grp = groupSchema({
      name: 'Test'
    })
    grp.save(function (err, group) {
      expect(err).to.not.exist
      expect(group).to.be.a('object')

      ticketSchema.getTicketByUid(1000, function (err, ticket) {
        expect(err).to.not.exist
        var ownerId = m.Types.ObjectId()
        ticket.setTicketGroup(ownerId, group._id, function (err, ticket) {
          expect(err).to.not.exist
          expect(ticket.group.name).to.equal('Test')

          done()
        })
      })
    })
  })

  it('should clear the ticket assignee', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      ticket.clearAssignee(m.Types.ObjectId(), function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.assignee).to.not.exist

        done()
      })
    })
  })

  it('should add Comment and Save', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var comment = {
        owner: m.Types.ObjectId(),
        date: new Date(),
        comment: 'This is a comment'
      }

      ticket.comments.push(comment)

      // Fake populate required Fields
      ticket.group = m.Types.ObjectId()
      ticket.owner = m.Types.ObjectId()
      ticket.type = m.Types.ObjectId()

      ticket.save(function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.comments).to.have.length(1)

        done()
      })
    })
  })

  it('should update comment', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var commentId = ticket.comments[0]._id
      expect(commentId).to.exist

      ticket.updateComment(m.Types.ObjectId(), commentId, 'This is the new comment text', function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.comments[0].comment).to.equal('This is the new comment text')

        done()
      })
    })
  })

  it('should remove comment', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var commentId = ticket.comments[0]._id
      expect(commentId).to.exist

      ticket.removeComment(m.Types.ObjectId(), commentId, function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.comments).to.have.length(0)

        done()
      })
    })
  })

  it('should add Note and Save', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var note = {
        owner: m.Types.ObjectId(),
        date: new Date(),
        note: 'This is a note'
      }

      ticket.notes.push(note)

      // Fake populate required Fields
      ticket.group = m.Types.ObjectId()
      ticket.owner = m.Types.ObjectId()
      ticket.type = m.Types.ObjectId()

      ticket.save(function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.notes).to.have.length(1)

        done()
      })
    })
  })

  it('should update note', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var noteId = ticket.notes[0]._id
      expect(noteId).to.exist

      ticket.updateNote(m.Types.ObjectId(), noteId, 'This is the new note text', function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.notes[0].note).to.equal('This is the new note text')

        done()
      })
    })
  })

  it('should remove note', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var noteId = ticket.notes[0]._id
      expect(noteId).to.exist

      ticket.removeNote(m.Types.ObjectId(), noteId, function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.notes).to.have.length(0)

        done()
      })
    })
  })

  it('should set ticket issue', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
      expect(err).to.not.exist
      expect(ticket).to.be.a('object')

      var ownerId = m.Types.ObjectId()
      ticket.setIssue(ownerId, 'This is the new issue text', function (err, ticket) {
        expect(err).to.not.exist
        expect(ticket.issue).to.equal('<p>This is the new issue text</p>\n')

        done()
      })
    })
  })

  it('should get all tickets', function (done) {
    ticketSchema.getForCache(function (err, tickets) {
      expect(err).to.not.exist
      expect(tickets).to.have.length(1)

      done()
    })
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
          ticketSchema.getTickets(undefined, function (err, tickets) {
            expect(err).to.exist

            cb()
          })
        },
        function (cb) {
          ticketSchema.getTickets(1, function (err, tickets) {
            expect(err).to.exist

            cb()
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  it('should get all tickets for group with limit', function (done) {
    // todo Rewrite this with GetTicketsWithObject Test
    return done()
  })

  it('should get all tickets for group by status', function (done) {
    async.parallel(
      [
        function (cb) {
          ticketSchema.getTicketsByStatus([m.Types.ObjectId()], 0, function (err, tickets) {
            expect(err).to.not.exist
            expect(tickets).to.have.length(0)

            cb()
          })
        },
        function (cb) {
          ticketSchema.getTicketsByStatus(undefined, 0, function (err, tickets) {
            expect(err).to.exist

            cb()
          })
        },
        function (cb) {
          ticketSchema.getTicketsByStatus(m.Types.ObjectId(), 0, function (err, tickets) {
            expect(err).to.exist

            cb()
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  it('should get all tickets by status', function (done) {
    ticketSchema.getAllByStatus(0, function (err, tickets) {
      expect(err).to.not.exist

      expect(tickets).to.have.length(1)

      done()
    })
  })

  it('should get ticket by _id', function (done) {
    async.parallel(
      [
        function (cb) {
          ticketSchema.getTicketById(m.Types.ObjectId(), function (err, ticket) {
            expect(err).to.not.exist

            cb()
          })
        },
        function (cb) {
          ticketSchema.getTicketById(undefined, function (err, ticket) {
            expect(err).to.exist

            cb()
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  it('should get tickets by assignee', function (done) {
    async.parallel(
      [
        function (cb) {
          ticketSchema.getAssigned(m.Types.ObjectId(), function (err, tickets) {
            expect(err).to.not.exist

            cb()
          })
        },
        function (cb) {
          ticketSchema.getAssigned(undefined, function (err, tickets) {
            expect(err).to.exist

            cb()
          })
        }
      ],
      function () {
        done()
      }
    )
  })

  // Should be last
  it('should soft delete ticket with UID 1000', function (done) {
    ticketSchema.getTicketByUid(1000, function (err, ticket) {
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
