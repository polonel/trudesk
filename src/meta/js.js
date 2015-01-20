"use strict";

var winston = require('winston'),
    fork = require('child_process').fork,
    path = require('path'),
    async = require('async'),
    _ = require('underscore'),
    os = require('os'),
    fs = require('fs');

module.exports = function(Meta) {
    Meta.js = {
        cache: '',
        map: '',
        hash: +new Date(),
        prepared: false,
        minFile: 'trudesk.min.js',
        scripts: {
            base: [
                'vendor/jquery/jquery.js',
                'https://cdnjs.cloudflare.com/ajax/libs/foundation/5.5.0/js/foundation.min.js',
                'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular.min.js',
                'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular-route.js',
                'vendor/modernizr/modernizr.js',
                'vendor/fastclick/fastclick.js',
                'vendor/placeholder/placeholder.js',
                'vendor/nicescroll/nicescroll.min.js',
                'vendor/underscore/underscore.js',
                '/socket.io/socket.io.js',
                //socketio:       'https://cdn.socket.io/socket.io-1.2.1',
                'vendor/history/jquery.history.js',

                'vendor/datatables/jquery.dataTables.js',
                'vendor/datatables/dataTables.responsive.js',
                'vendor/datatables/dataTables.foundation.js',
                'vendor/datatables/dataTables.grouping.js',
                'vendor/datatables/dataTables.scroller.js',
                'vendor/flot/jquery.flot.js',
                'vendor/flot/jquery.flot.symbol.js',
                'vendor/flot/jquery.flot.time.js',
                'vendor/flot/jquery.flot.tooltip.js',
                'vendor/fullcalendar/fullcalendar.min.js',
                'vendor/fullcalendar/moment.min.js',
                'vendor/easypiechart/easypiechart.js',
                'vendor/chosen/chosen.jquery.min.js',
                'plugins/autogrow.js',
                'appnew.js'
            ],

            rjs: []
        }
    };

    Meta.js.loadRJS = function(callback) {
        var rjsPath = path.join(__dirname, '../../../public/js/');
        async.parallel({
            modules: function(next) {
                utils.walk(path.join(rjsPath, 'modules'), next);
            }
        }, function(err, rjsFiles) {
            if (err) return callback(err);


        });
    };

    Meta.prepare = function(callback) {
        async.parallel([
            async.apply(Meta.js.loadRJS)
        ], function(err) {
            if (err) return callback(err);

            // Convert all scripts to paths relative to the NodeBB base directory
            var basePath = path.resolve(__dirname, '../..');
            Meta.js.scripts.all = Meta.js.scripts.base.concat(Meta.js.scripts.rjs, Meta.js.scripts.plugin, Meta.js.scripts.client).map(function(script) {
                return path.relative(basePath, script).replace(/\\/g, '/');
            });
            callback();
        })
    };

    Meta.js.minify = function(minify, callback) {
        var minifier = Meta.js.minifierProc = fork('minifier.js'),
            onComplete = function(err) {
                if (err) {
                    winston.error('[meta/js] Minification failed: ' + err.message);
                    process.exit(0);
                }

                winston.verbose('[meta/js] Minification complete');
                minifier.kill();

                if (process.send) {
                    process.send({

                    });
                }

                Meta.js.commitToFile();

                if (typeof callback === 'function') {
                    callback();
                }
            }
    }
};