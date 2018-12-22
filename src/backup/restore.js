/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    12/17/2018
 Author:     Chris Brame

 */

var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');
var spawn = require('child_process').spawn;
var os = require('os');
var AdmZip = require('adm-zip');
var archiver = require('archiver');
var database = require('../database');
var winston = require('winston');
var moment = require('moment');

global.env = process.env.NODE_ENV || 'production';

var CONNECTION_URI = null;
var databaseName = null;

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,8) + ' [Child:Backup:' + global.process.pid + ']';
    },
    level: global.env === 'production' ? 'info' : 'verbose'
});

function createZip(callback) {
    var filename = 'trudesk-' + moment().format('MMDDYYYY_HHmm') + '.zip';
    var output = fs.createWriteStream(path.join(__dirname, '../../backups/', filename));
    var archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', callback);
    output.on('end', callback);

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT')
            winston.warn(err);
        else {
            winston.error(err);
            return callback(err);
        }
    });

    archive.on('error', callback);

    archive.pipe(output);
    archive.directory(path.join(__dirname, '../../backups/dump/'), false);

    archive.finalize();
}

function cleanup(callback) {
    var rimraf = require('rimraf');
    rimraf(path.join(__dirname, '../../restores/restore_*'), callback);
}

function copyFiles(callback) {
    fs.copy(path.join(__dirname, '../../public/uploads/'), path.join(__dirname, '../../backups/dump/'), callback);
}

function extractArchive(file, callback) {
    var zip = new AdmZip(path.join(__dirname, '../../backups/', file));
    zip.extractAllTo(path.join(__dirname, '../../restores/restore_' + file + '/'), true);

    if (_.isFunction(callback))
        return callback();
}

function cleanMongoDb(callback) {
    database.db.connection.db.dropDatabase(callback);
}

function runRestore(file, callback) {
    var platform = os.platform();
    winston.info('Starting Restore... (' + platform + ')');

    var options = ['--uri', CONNECTION_URI, '-d', databaseName, path.join(__dirname, '../../restores/restore_' + file, 'database/trudesk')];
    var mongodump = spawn(path.join(__dirname, 'bin', platform, 'mongorestore'), options);

    mongodump.stdout.on('data', function(data) {
        winston.debug(data.toString());
    });

    mongodump.stderr.on('data', function(data) {
        winston.debug(data.toString());
    });

    mongodump.on('exit', function(code) {
        if (code === 0) {
            callback(null, 'done');
        } else
            callback(new Error('MongoDump falied with code ' + code));
    });
}

(function() {
    CONNECTION_URI = process.env.MONGOURI;
    if (!CONNECTION_URI) return process.send({success: false, error: 'Invalid connection uri'});

    var FILE = process.env.FILE;
    if (!FILE) return process.send({success: false, error: 'Invalid File'});

    if (!fs.existsSync(path.join(__dirname, '../../backups', FILE))) {
        process.send({success: false, error: 'FILE NOT FOUND'});
        return;
    }

    var options = { keepAlive: 0, auto_reconnect: false, connectTimeoutMS: 5000, useNewUrlParser: true };
    database.init(function(e, db) {
        if (e) {
            process.send({success: false, error: e});
            return;
        }

        if (!db) {
            process.send({success: false, error: {message: 'Unable to open database'}});
            return;
        }

        databaseName = database.db.connection.db.databaseName;
        cleanMongoDb(function(err) {
            if (err)
                process.send({success: false, error: err});
            else {
                cleanup(function() {
                    extractArchive(FILE, function () {
                        runRestore(FILE, function (err, result) {
                            console.log(result);
                            cleanup(function() {
                                process.send({success: true});
                            });
                        });
                    });
                });
            }
        });
        // extractArchive('trudesk-12222018_0236.zip');


    }, CONNECTION_URI, options);
}());