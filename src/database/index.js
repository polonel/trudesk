var mongoose = require('mongoose'),
    nconf = require('nconf'),
    d = require('domain').create(),
    winston = require('winston');

var db = {};
//var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@127.0.0.1/trudesk';
var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@dogen.mongohq.com:10094/app31908899';

d.on('error', function(er) {
    winston.error('Oh no, something wrong with DB! - ' + er.message);
});

mongoose.connection.on('connected', function() {
    winston.info('Connected to MongoDB');
});

var options = { server: { auto_reconnect: true, socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
                replset: { auto_reconnect: true, socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } } };

var connectWithRetry = function(callback) {
    return mongoose.connect(CONNECTION_URI, options, function(e) {
        if (e) {
            setTimeout(connectWithRetry, 10000);
            return false;
        }
        db.connection = mongoose.connection;
        callback(e, db);
    });
};

function run(callback) {
    d.run(function() {
        connectWithRetry(callback);
    });
}

module.exports.init = function(callback) {
    mongoose.connect(CONNECTION_URI, options, function(e) {
        db.connection = mongoose.connection;

        callback(e, db);
    });
};

module.exports.db = db;