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

var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } } };

module.exports.init = function(callback) {
    d.run(function() {
        mongoose.connect(CONNECTION_URI, options, function(e) {
            db.connection = mongoose.connection;

            callback(e, db);
        });
    });
};

module.exports.db = db;