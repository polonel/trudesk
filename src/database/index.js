/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var mongoose = require('mongoose'),
    nconf = require('nconf'),
    d = require('domain').create(),
    winston = require('winston');

var db = {};

var CONNECTION_URI = 'mongodb://' + nconf.get('mongo:username') + ':' + nconf.get('mongo:password') + '@' + nconf.get('mongo:host') + ':' + nconf.get('mongo:port') + '/' + nconf.get('mongo:database');
//var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@127.0.0.1/trudesk';
//var CONNECTION_URI = 'mongodb://trudesk:#TruDesk$@dogen.mongohq.com:10094/app31908899';

d.on('error', function(er) {
    winston.error('Oh no, something went wrong with DB! - ' + er.message);
});

mongoose.connection.on('error', function(e) {
    winston.error('Oh no, something went wrong with DB! - ' + e.message);
});

mongoose.connection.on('connected', function() {
    winston.info('Connected to MongoDB');
});

var options = { server: { auto_reconnect: true, socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }};

module.exports.init = function(callback) {
    if (db.connection && db.connection.state == 'connected') {
        callback(null, db);
    } else {
        mongoose.connect(CONNECTION_URI, options, function(e) {
            db.connection = mongoose.connection;

            callback(e, db);
        });
    }
};

module.exports.db = db;