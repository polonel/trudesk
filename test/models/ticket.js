require('blanket');
var expect = require('chai').expect;
var should = require('chai').should();
var winston = require('winston');
var database = require('../../src/database');
var dbHelper = require('../helpers/database');

var ticketSchema = require('../../src/models/ticket');

var mongoose;

describe('ticket.js', function() {
    before(function(done) {
        var m = require('mongoose');
        m.connection.close();
        database.init(function(err, db) {
            expect(err).to.not.exist;
            expect(db).to.be.a('object');
            expect(db.connection).to.exist;

            mongoose = db;

            done();

        }, 'mongodb://localhost/polonel_trudesk31908899');
    });

    it('should clear collections.', function(done) {
        expect(mongoose).to.exist;

        dbHelper.clearCollections(mongoose, function(err) {
            expect(err).to.not.exist;

            done();
        });
    });

    it('should create ticket', function(done) {
        var m = require('mongoose');
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
