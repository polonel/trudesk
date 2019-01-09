#!/usr/bin/env node
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

var async       = require('async'),
    path        = require('path'),
    fs          = require('fs'),
    winston     = require('winston'),
    nconf       = require('nconf'),
    pkg         = require('./package.json'),
    ws          = require('./src/webserver');
    //`var memory = require('./src/memory');


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

process.on('message', function(msg) {
    if (msg === 'shutdown') {
        winston.debug('Closing all connections...');

        if (ws.server)
            ws.server.close();

        throw new Error('Server has shutdown.');
    }
});

if (!process.env.FORK) {
    winston.info('    .                              .o8                     oooo');
    winston.info('  .o8                             "888                     `888');
    winston.info('.o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo');
    winston.info('  888   `888""8P `888  `888  d88\' `888  d88\' `88b d88(  "8  888 .8P\'');
    winston.info('  888    888      888   888  888   888  888ooo888 `"Y88b.   888888.');
    winston.info('  888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.');
    winston.info('  "888" d888b     `V88V"V8P\' `Y8bod88P" `Y8bod8P\' 8""888P\' o888o o888o');
    winston.info('==========================================================================');
    winston.info('trudesk v' + pkg.version + ' Copyright (C) 2014-2018 Chris Brame');
    winston.info('');
    winston.info('Running in: ' + global.env);
    winston.info('Server Time: ' + new Date());
}

var configFile = path.join(__dirname, '/config.json'),
    configExists;

if (nconf.get('config')) 
    configFile = path.resolve(__dirname, nconf.get('config'));

configExists = fs.existsSync(configFile);

if (process.env.HEROKU) {
    //Build Config for Heroku
    var configHeroku = {
        'url': 'http://localhost:8118',
        'port': '8118'
    };

    winston.info('Creating heroku config file...');
    var config = JSON.stringify(configHeroku, null, 4);

    if (configExists)
        fs.unlinkSync(configFile);

    fs.writeFileSync(configFile, config);

    start();
}

if (nconf.get('install') || !configExists && !process.env.HEROKU) {
    ws.installServer(function() {
        return winston.info('Trudesk Install Server Running...');
    });
}

if (!nconf.get('setup') && !nconf.get('install') && !nconf.get('upgrade') && !nconf.get('reset') && configExists) 
    start();


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

        } else 
            dbCallback(err, db);
        
    });
}

function dbCallback(err, db) {
    if (err) 
        return start();

    ws.init(db, function(err) {
        if (err) {
            winston.error(err);
            return;
        }

        async.series([
            function(next) {
                require('./src/socketserver')(ws);
                return next();
            },
            function(next) {
                //Start Check Mail
                var settingSchema = require('./src/models/setting');
                settingSchema.getSetting('mailer:check:enable', function(err, mailCheckEnabled) {
                    if (err) {
                        winston.warn(err);
                        return next();
                    }

                    if (mailCheckEnabled && mailCheckEnabled.value) {
                        settingSchema.getSettings(function(err, settings) {
                            if (err) return next();

                            var mailCheck = require('./src/mailer/mailCheck');
                            winston.debug('Starting MailCheck...');
                            mailCheck.init(settings);
                        });
                    }

                    return next();
                });
            },
            function(next) {
                require('./src/settings/defaults').init(next);
            },
            function(next) {
                winston.debug('Building dynamic sass...');
                require('./src/sass/buildsass').build(next);
            },
            function(next) {
                //Start Task Runners
                require('./src/taskrunner');
                return next();
            },
            function(next) {
                //var pm2 = require('pm2');
                //pm2.connect(true, function(err) {
                //    if (err) throw err;
                //    pm2.start({
                //        script: path.join(__dirname, '/src/cache/index.js'),
                //        name: 'trudesk:cache',
                //        output: path.join(__dirname, '/logs/cache.log'),
                //        error: path.join(__dirname, '/logs/cache.log'),
                //        env: {
                //            FORK: 1,
                //            NODE_ENV: global.env
                //        }
                //    }, function(err) {
                //        pm2.disconnect();
                //        if (err) throw err;
                //
                //        process.on('message', function(message) {
                //            if (message.data.cache) {
                //                var nodeCache = require('./src/cache/node-cache');
                //                global.cache = new nodeCache({
                //                    data:  message.data.cache.data,
                //                    checkperiod: 0
                //                });
                //            }
                //        });
                //
                //        next();
                //    });
                //});

                var fork = require('child_process').fork;
                var memLimit = '2048';
                if (process.env.MEMORYLIMIT)
                    memLimit = process.env.MEMORYLIMIT;
                var n = fork(path.join(__dirname, '/src/cache/index.js'), { execArgv: ['--max-old-space-size=' + memLimit], env: { FORK: 1, NODE_ENV: global.env } } );

                global.forks.push({name: 'cache', fork: n});

                n.on('message', function(data) {
                    if (data.cache) {
                        var NodeCache = require('./src/cache/node-cache');
                        global.cache = new NodeCache({
                            data: data.cache.data,
                            checkperiod: 0
                        });
                    }
                });

                return next();
            }
        ], function() {
            winston.info('trudesk Ready');
        });
    });
}
