var mongoose = require('mongoose'),
    nconf = require('nconf');

var db = {};

module.exports.init = function(callback) {
    mongoose.connect('mongodb://trudesk:#TruDesk$@127.0.0.1/trudesk', {auto_reconnect: true}, function(e) {
        db.connection = mongoose.connection;
        callback(e, db);

    });
};

module.exports.db = db;