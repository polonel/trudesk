#!/usr/bin/env node
"use strict";

var winston = require('winston');

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
        if (err) throw err;
        var ws = require('./src/webserver');
        ws.init(db);

        var cs = require('./src/chatserver')(ws.server);
    });

}

start();