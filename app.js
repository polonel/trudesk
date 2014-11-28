#!/usr/bin/env node
"use strict";

var winston = require('winston'),
    async = require('async');

global.env = process.env.NODE_ENV || 'development';

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true
});

winston.add(winston.transports.File, {
    filename: 'logs/error.log',
    level: 'error'
});

function start() {
    winston.info('Time: ' + new Date());

    require('./src/database').init(function(err, db) {
        if (err) {
            winston.error('FETAL: ' + err.message);
            winston.warn('Retrying to connect to MongoDB in 10secs...');
            return setTimeout(function() {
                require('./src/database').init(dbCallback);
            }, 10000);
        }

        dbCallback(err, db);
    });
}

function dbCallback(err, db) {
    if (err) {
        return start();
    }
    var ws = require('./src/webserver');

    ws.init(db, function(err) {
        var ss = require('./src/socketserver')(ws);
    });
}

start();