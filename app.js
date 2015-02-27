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

var async   = require('async'),
    path    = require('path'),
    fs      = require('fs'),
    winston = require('winston'),
    nconf = require('nconf'),
    pkg     = require('./package.json');

nconf.argv().env();

global.env = process.env.NODE_ENV || 'development';
//global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels);
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
    winston.info('    .                              .o8                     oooo');
    winston.info('  .o8                             "888                     `888');
    winston.info('.o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo');
    winston.info('  888   `888""8P `888  `888  d88\' `888  d88\' `88b d88(  "8  888 .8P\'');
    winston.info('  888    888      888   888  888   888  888ooo888 `"Y88b.   888888.');
    winston.info('  888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.');
    winston.info('  "888" d888b     `V88V"V8P\' `Y8bod88P" `Y8bod8P\' 8""888P\' o888o o888o');
    winston.info('==========================================================================');
    winston.info('TruDesk v' + pkg.version + ' Copyright (C) 2014-2015 Polonel.com');
    winston.info('');
}

var configFile = path.join(__dirname, '/config.json'),
    configExists;

if (nconf.get('config')) {
    configFile = path.resolve(__dirname, nconf.get('config'));
}
configExists = fs.existsSync(configFile);

if (!nconf.get('setup') && !nconf.get('install') && !nconf.get('upgrade') && !nconf.get('reset') && configExists) {
    start();
} else if (nconf.get('setup') || nconf.get('install') || !configExists) {
    setup();
} else if (nconf.get('upgrade')) {
    //upgrade();
} else if (nconf.get('reset')) {
    reset();
}

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

    winston.info('Running in: ' + global.env);
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

function setup() {
    loadConfig();

    if (nconf.get('setup')) {
        winston.info('Starting trudesk setup....');
    } else {
        winston.warn('Configuration not found!!! Starting trudesk setup....');
    }

    var install = require('./src/install');

    install.setup(function(err) {
        if (err) {
            winston.error('There was a problem completing trudesk setup: ', err.message);
        } else {
            winston.info('trudesk Setup Completed. Run \'./trudesk start\' to manually start your trudesk server.');
        }

        process.exit();
    })
}

function dbCallback(err, db) {
    if (err) {
        return start();
    }
    var ws = require('./src/webserver');

    ws.init(db, function(err) {
        if (err) {
            winston.error(err);
            return;
        }

        async.series([
            function(next) {
                require('./src/socketserver')(ws);
                next();
            },
            function(next) {
                //Start Mailer
                var mailQueue = require('./src/mailer');
                mailQueue.queue();
                next();
            },
            function(next) {
                //Start Task Runners
                var taskrunner = require('./src/taskrunner');
                next();
            }
        ], function() {
            winston.info("TruDesk Ready");
        });
    });
}