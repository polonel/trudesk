/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

var async   = require('async'),
    path    = require('path'),
    fs      = require('fs'),
    winston = require('winston'),
    wConfig = require('winston/lib/winston/config'),
    nconf = require('nconf'),
    NodeCache = require('node-cache'),
    pkg     = require('./package.json');

global.forks = [];

nconf.argv().env();

global.env = process.env.NODE_ENV || 'development';
//global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,8) + ' [' + global.process.pid + ']';
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

if (!process.env.FORK) {
    winston.info('    .                              .o8                     oooo');
    winston.info('  .o8                             "888                     `888');
    winston.info('.o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo');
    winston.info('  888   `888""8P `888  `888  d88\' `888  d88\' `88b d88(  "8  888 .8P\'');
    winston.info('  888    888      888   888  888   888  888ooo888 `"Y88b.   888888.');
    winston.info('  888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.');
    winston.info('  "888" d888b     `V88V"V8P\' `Y8bod88P" `Y8bod8P\' 8""888P\' o888o o888o');
    winston.info('==========================================================================');
    winston.info('TruDesk v' + pkg.version + ' Copyright (C) 2014-2016 Chris Brame');
    winston.info('');
    winston.info('Running in: ' + global.env);
    winston.info('Time: ' + new Date());
}

//CLUSTER STUFF
//var cluster = require('cluster');
//if (cluster.isMaster) {
//    var numWorkers = require('os').cpus().length;
//    winston.info('Master cluster setting up ' + numWorkers + ' workers...');
//
//    for (var i = 0; i < numWorkers; i++) {
//        cluster.fork({FORK: 1});
//    }
//
//    cluster.on('online', function(worker) {
//        winston.debug('Worker ' + worker.process.pid + ' is online');
//    });
//
//    cluster.on('exit', function(worker, code, signal) {
//        winston.warn('Worker ' + worker.process.pid + ' crashed with code: ' + code);
//        winston.info('Starting a new worker');
//        cluster.fork({FORK: 1});
//    });
//} else {
//
//}

var configFile = path.join(__dirname, '/config.json'),
    configExists;

if (nconf.get('config')) {
    configFile = path.resolve(__dirname, nconf.get('config'));
}
configExists = fs.existsSync(configFile);

if (process.env.HEROKU) {
    //Build Config for Heroku
    var configHeroku = {
        "url": "http://localhost:8118",
        "port": "8118",
        "mailer": {
            "enable": false,

            "check": {
                "enable": false
            }
        }
    };

    winston.info('Creating heroku config file...');
    var config = JSON.stringify(configHeroku, null, 4);

    if (configExists)
        fs.unlinkSync(configFile);

    fs.writeFileSync(configFile, config);

    start();
}

if (!nconf.get('setup') && !nconf.get('install') && !nconf.get('upgrade') && !nconf.get('reset') && configExists) {
    start();
} else if (nconf.get('setup') || nconf.get('install') || !configExists && !process.env.HEROKU) {
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

    var _db = require('./src/database');

    _db.init(function(err, db) {
        if (err) {
            winston.error('FETAL: ' + err.message);
            winston.warn('Retrying to connect to MongoDB in 10secs...');
            return setTimeout(function() {
                _db.init(dbCallback);
            }, 10000);

        } else {
            var install = require('./src/install');
            install.setup(function(err) {
                if (err) {
                    winston.error('There was a problem completing trudesk setup: ', err.message);
                }

                dbCallback(err, db);
            });
        }
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
            winston.err(err);
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
                //Start Check Mail
                var mailerEnabled = nconf.get('mailer:enable');
                if (mailerEnabled) {
                    var mailCheck = require('./src/mailer/mailCheck');
                    mailCheck.init();
                }

                next();
            },
            function(next) {
                //Start Task Runners
                var taskrunner = require('./src/taskrunner');
                next();
            },
            function(next) {
                var fork = require('child_process').fork;
                var n = fork(path.join(__dirname, '/src/cache/index.js'), { env: { FORK: 1, NODE_ENV: global.env, MONGODB_DATABASE_NAME: process.env.MONGODB_DATABASE_NAME } } );

                global.forks.push({name: 'cache', fork: n});

                n.on('message', function(data) {
                    if (data.cache) {
                        var nodeCache = require('./src/cache/node-cache');
                        global.cache = new nodeCache({
                            data: data.cache.data,
                            checkperiod: 0
                        });
                    }
                });

                //
                //n.on('exit', function (code, signal) {
                //    console.log('Child exited:', code, signal);
                //});

                next();
                //winston.debug('Initializing Cache...');
                //var cache = require('./src/cache');
                //cache.init(function() {
                //    next();
                //});
            }
        ], function() {
            winston.info("TruDesk Ready");
        });
    });
}
