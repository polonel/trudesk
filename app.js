
var path    = require('path'),
    winston = require('winston'),
    async = require('async'),
    nconf = require('nconf'),
    emitter = require('./src/emitter'),
    pkg     = require('./package.json');

nconf.argv().env();

global.env = process.env.NODE_ENV || 'development';
//global.env = process.env.NODE_ENV || 'production';

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,5) + ' [' + global.process.pid + ']';
    },
    level: global.env === 'production' ? 'info' : 'verbose'
});

winston.add(winston.transports.File, {
    filename: 'logs/error.log',
    level: 'error'
});

winston.err = function (err) {
    winston.error(err.stack);
};

if (!process.send) {
    winston.info('TruDesk v' + pkg.version + ' Copyright (C) 2014-2015 Polonel.com');
    winston.info('This program comes with ABSOLUTELY NO WARRANTY.');
    winston.info('This is free software, and you are welcome to redistribute it under certain conditions.');
    winston.info('');
}

var configFile = path.join(__dirname, '/config.json'),
    configExists;

function loadConfig() {
    nconf.file({
        file: configFile
    });

    nconf.defaults({
        base_dir: __dirname
    });
}

function start() {
    loadConfig();
//    if (process.env.NODETIME_ACCOUNT_KEY) {
//        require('nodetime').profile({
//            accountKey: process.env.NODETIME_ACCOUNT_KEY,
//            appName: 'TruDesk'
//        });
//    }

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
        if (err) {
            winston.err(err);
            return;
        }
        var ss = require('./src/socketserver')(ws);
    });
}

start();