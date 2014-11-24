var mongoose = require('mongoose'),
    nconf = require('nconf');

var db = {};
//var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@127.0.0.1/trudesk';
var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@dogen.mongohq.com:10094/app31908899';

module.exports.init = function(callback) {
    mongoose.connect(CONNECTION_URI, {auto_reconnect: true}, function(e) {
        db.connection = mongoose.connection;
        callback(e, db);

    });
};

module.exports.db = db;