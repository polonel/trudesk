require('blanket');
var expect = require('chai').expect;
var should = require('chai').should();
var assert = require('chai').assert;
var winston = require('winston');
var async = require('async');

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
var database = require('../src/database');
var CONNECTION_URI = 'mongodb://localhost/polonel_trudesk31908899';

describe('Database', function() {
    beforeEach(function(done) {
        //Need to invalid Database Module before each test runs.
        var modulePath = require.resolve('../src/database');
        delete require.cache[modulePath];
        database = require('../src/database');

        done();
    });
    it ('should throw error for incorrect CONNECTION_URI', function(done) {
        database.init(function(err, db) {
            expect(err).to.exists;
            expect(db).to.be.a('object');
            expect(db.connection).to.not.be.a('undefined');
            expect(db.connection._readyState).to.equal(0);

            done();
        }, 'mongodb://');
    });

    it('should connect without error', function(done) {
        async.series([
            function(cb) {
              database.init(function(err, db) {
                expect(err).to.not.exists;
                expect(db).to.be.a('object');
                expect(db.connection._readyState).to.equal(1);

                cb();
              }, CONNECTION_URI);
            },
            function(cb) {
              //Test rerunning init and getting DB back without calling connect.
              database.init(function(err, db) {
                expect(err).to.not.exists;
                expect(db).to.be.a('object');
                expect(db.connection._readyState).to.equal(1);

                cb();

              }, CONNECTION_URI);
            }
        ], function(err) {
            done();
        });
    });
});
