require('blanket');
var expect = require('chai').expect;
var should = require('chai').should();
var winston = require('winston');
var async = require('async');
var mongoose = require('mongoose');

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
var database, db;
var CONNECTION_URI = 'mongodb://localhost/polonel_trudesk31908899';

//Global Setup for tests
before(function(done) {
    this.timeout(15000); // Make it a longer timeout since we have to start the web server
    delete require.cache[require.resolve('../src/database')];
    delete require.cache[require.resolve('mongoose')];
    mongoose = require('mongoose');
    database = require('../src/database');

    mongoose.connection.close();
    database.init(function(err, d) {
        expect(err).to.not.exist;
        expect(d).to.be.a('object');
        expect(d.connection).to.exist;

        db = d;

        async.series([
            function(cb) {
                mongoose.connection.db.dropDatabase(function(err) {
                    expect(err).to.not.exist;
                    cb();
                });
            },
            function(cb) {
                var counter = require('../src/models/counters');
                counter.create({
                    _id: 'tickets',
                    next: 1000
                }, function(err) {
                    expect(err).to.not.exist;

                    cb();
                });
            },
            function(cb) {
                var userSchema = require('../src/models/user');
                userSchema.create({
                    username: 'trudesk',
                    password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
                    fullname: 'Trudesk',
                    email: 'trudesk@trudesk.io',
                    role: 'admin'
                }, function(err, user) {
                    expect(err).to.not.exist;
                    expect(user).to.be.a('object');

                    cb();
                });
            },
            function(cb) {
                var ws = require('../src/webserver');
                ws.init(db, function(err) {
                    expect(err).to.not.exist;
                    global.server = ws.server;

                    cb();
                }, 3111);
            }
        ], function() {
            done();
        });
    }, CONNECTION_URI);
});


//Global Teardown for tests
after(function(done) {
    this.timeout(5000);
    mongoose.connection.db.dropDatabase(function() {
        mongoose.connection.close(function() {
            server.close();

            done();
        });
    });
});

//Start DB Tests
describe('Database', function() {
    beforeEach(function(done) {
        //Need to invalid Database Module before each test runs.
        var modulePath = require.resolve('../src/database');
        delete require.cache[modulePath];
        database = require('../src/database');

        done();
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
