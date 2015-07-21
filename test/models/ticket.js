require('blanket');
var expect = require('chai').expect;
var should = require('chai').should();
var winston = require('winston');
var database = require('../../src/database');
var dbHelper = require('../helpers/database');

var mongoose;

describe('ticket.js', function() {
    before(function(done) {
        database.init(function(err, db) {
            expect(err).to.not.exists;
            expect(db).to.be.a('object');
            expect(db.connection).to.exists;

            mongoose = db;

            done();

        }, 'mongodb://localhost/polonel_trudesk31908899');
    });

    it('should clear collections.', function(done) {
        expect(mongoose).to.exists;

        dbHelper.clearCollections(mongoose, function(err) {
            expect(err).to.exists;
            expect(mongoose.connection.collections).to.be.empty;
            done();
        });
    });
});
