/*
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
    winston = require('winston');

var db = {};

var dbPassword = encodeURIComponent(nconf.get('mongo:password'));

var CONNECTION_URI = 'mongodb://' + nconf.get('mongo:username') + ':' + dbPassword + '@' + nconf.get('mongo:host') + ':' + nconf.get('mongo:port') + '/' + nconf.get('mongo:database');

mongoose.connection.on('error', function(e) {
    winston.error('Oh no, something went wrong with DB! - ' + e.message);
});

mongoose.connection.on('connected', function() {
    if (!process.env.FORK)
        winston.info('Connected to MongoDB');
});

var options = { keepAlive: 1, connectTimeoutMS: 30000, useNewUrlParser: true };

module.exports.init = function(callback, connectionString, opts) {
    if (connectionString) CONNECTION_URI = connectionString;
    if (opts) options = opts;
    if (process.env.MONGOHQ_URL !== undefined) CONNECTION_URI = process.env.MONGOHQ_URL.trim();

    if (db.connection) 
        return callback(null, db);

    mongoose.Promise = global.Promise;
    mongoose.connect(CONNECTION_URI, options, function(e) {
        if (e) return callback(e, null);
        db.connection = mongoose.connection;

        return callback(e, db);
    });
};

module.exports.db = db;
