require('blanket');
var async = require('async');
var expect = require('chai').expect;
var should = require('chai').should();
var winston = require('winston');
var database = require('../../src/database');
var dbHelper = require('../helpers/database');
var m = require('mongoose');

var ticketSchema = require('../../src/models/ticket');

var mongoose;

describe('ticket.js', function() {
    before(function(done) {
        this.timeout(5000);
        m.connection.close();
        database.init(function(err, db) {
            expect(err).to.not.exist;
            expect(db).to.be.a('object');
            expect(db.connection).to.exist;

            mongoose = db;

            m.connection.db.dropDatabase(function() {
                //create counter
                var counter = require('../../src/models/counters');
                counter.create({
                    _id: 'tickets',
                    next: 1000
                }, function(err) {
                    expect(err).to.not.exist;

                    done();

                    //m.connection.close(function() {
                    //    done();
                    //});
                });
            });

        }, 'mongodb://localhost/polonel_trudesk31908899');
    });

    //it('should clear collections.', function(done) {
    //    expect(mongoose).to.exist;
    //
    //    dbHelper.clearCollections(mongoose, function(err) {
    //        expect(err).to.not.exist;
    //
    //        done();
    //    });
    //});

    it('should create ticket', function(done) {
        ticketSchema.create({
            owner: m.Types.ObjectId(),
            group: m.Types.ObjectId(),
            status: 0,
            tags: [],
            date: new Date(),
            subject: 'Dummy Test Subject',
            issue: 'Dummy Test Issue',
            priority: 0,
            type: m.Types.ObjectId(),
            history: []

        }, function(err, t) {
            expect(err).to.not.exists;
            expect(t).to.be.a('object');
            expect(t._doc).to.include.keys(
                '_id', 'uid', 'owner','group', 'status', 'tags', 'date', 'subject', 'issue', 'priority', 'type', 'history', 'attachments', 'comments', 'deleted'
            );

            expect(t.uid).to.equal(1000);

            done();
        });
    });

    it('should set the ticket status to closed then to open', function(done) {
        async.series([
            function(cb) {
                ticketSchema.getTicketByUid(1000, function(err, ticket) {
                    expect(err).to.not.exist;
                    expect(ticket).to.be.a('object');

                    ticket.setStatus(m.Types.ObjectId(), 3, function(err, ticket) {
                        expect(ticket.status).to.equal(3);
                        expect(ticket.closedDate).to.exist;

                        cb();
                    });
                });
            },
            function(cb) {
                ticketSchema.getTicketByUid(1000, function(err, ticket) {
                    expect(err).to.not.exist;
                    expect(ticket).to.be.a('object');

                    ticket.setStatus(m.Types.ObjectId(), 1, function(err, ticket) {
                        expect(ticket.status).to.equal(1);
                        expect(ticket.closedDate).to.not.exist;

                        cb();
                    });
                });
            }
        ], function() {
            done();
        });
    });

    it('should set assignee to user', function(done){
        var userSchema = require('../../src/models/user');
        async.waterfall([
            function(cb) {
                userSchema.create({
                    username: 'trudesk',
                    password: 'password',
                    fullname: 'Trudesk',
                    email: 'trudesk@trudkes.io',
                    role: 'admin'
                }, function(err, user) {
                    expect(err).to.not.exist;
                    expect(user).to.be.a('object');

                    cb(null, user._id);
                });
            },
            function(userId, cb) {
                ticketSchema.getTicketByUid(1000, function(err, ticket) {
                    ticket.setAssignee(userId, userId, function(err, ticket) {
                        expect(err).to.not.exist;
                        expect(ticket.assignee).to.equal(userId);

                        cb();
                    });
                });
            }
        ], function() {
            done();
        });
    });

    it('should set ticket type', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            var type = m.Types.ObjectId();
            var ownerId = m.Types.ObjectId();
            ticket.setTicketType(ownerId, type, function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.type).to.equal(type);

                done();
            });
        });
    });

    it('should set ticket priority', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            var ownerId = m.Types.ObjectId();
            ticket.setTicketPriority(ownerId, 3, function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.priority).to.equal(3);

                done();
            });
        });
    });

    it('should set ticket group', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            var group = m.Types.ObjectId();
            var ownerId = m.Types.ObjectId();
            ticket.setTicketGroup(ownerId, group, function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.group).to.equal(group);

                done();
            });
        });
    });

    it('should clear the ticket assignee', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            ticket.clearAssignee(m.Types.ObjectId(), function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.assignee).to.not.exist;

                done();
            });
        });
    });

    it('should add Comment and Save', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            var comment = {
                owner: m.Types.ObjectId(),
                date: new Date(),
                comment: 'This is a comment'
            };

            ticket.comments.push(comment);

            //Fake populate required Fields
            ticket.group = m.Types.ObjectId();
            ticket.owner = m.Types.ObjectId();
            ticket.type = m.Types.ObjectId();

            ticket.save(function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.comments).to.have.length(1);

                done();
            });
        });
    });

    it('should update comment', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            var commentId = ticket.comments[0]._id;
            expect(commentId).to.exist;

            ticket.updateComment(m.Types.ObjectId(), commentId, 'This is the new comment text', function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.comments[0].comment).to.equal('This is the new comment text');

                done();
            });
        });
    });

    it('should remove comment', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            var commentId = ticket.comments[0]._id;
            expect(commentId).to.exist;

            ticket.removeComment(m.Types.ObjectId(), commentId, function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.comments).to.have.length(0);

                done();
            });
        });
    });

    it('should set ticket issue', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            var ownerId = m.Types.ObjectId();
            ticket.setIssue(ownerId, 'This is the new issue text', function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket.issue).to.equal('This is the new issue text');

                done();
            });
        });
    });

    it('should get all tickets', function(done) {
        ticketSchema.getAll(function(err, tickets) {
            expect(err).to.not.exist;
            expect(tickets).to.have.length(1);

            done();
        });
    });

    it('should get all tickets for group', function(done) {
        ticketSchema.getTickets([m.Types.ObjectId()], function(err, tickets) {
            expect(err).to.not.exist;
            expect(tickets).to.have.length(0);

            done();
        });
    });

    it('should error getting tickets for group', function(done) {
        async.parallel([
            function(cb) {
                ticketSchema.getTickets(undefined, function(err, tickets) {
                    expect(err).to.exist;

                    cb();
                });
            },
            function(cb) {
                ticketSchema.getTickets(1, function(err, tickets) {
                    expect(err).to.exist;

                    cb();
                });
            }
        ], function() {
            done();
        });
    });

    //Should be last
    it('should soft delete ticket with UID 1000', function(done) {
        ticketSchema.getTicketByUid(1000, function(err, ticket) {
            expect(err).to.not.exist;
            expect(ticket).to.be.a('object');

            ticketSchema.softDelete(ticket._id, function(err, ticket) {
                expect(err).to.not.exist;
                expect(ticket).to.be.a('object');

                ticket.save(function(err, t) {
                    expect(err).to.not.exist;
                    expect(t).to.be.a('object');

                    expect(t.deleted).to.be.false;

                    done();
                });
            });
        });
    });
});
