var nconf = require('nconf'),
    async = require('async'),
    express = require('express'),
    WebServer = express(),
    server,
    winston = require('winston'),
    async = require('async'),
    db = require('./database'),
    middleware = require('./middleware'),
    routes = require('./routes');


server = require('http').createServer(WebServer);

(function (app) {
    "use strict";

    var port = process.env.PORT || 3000;

    module.exports.server = server;
    module.exports.init = function(db, callback) {
        middleware(app, db, function(middleware, store) {
            module.exports.sessionStore = store;
            routes(app, middleware);

            server.on('error', function(err) {
                if (err.code === 'EADDRINUSE') {
                    winston.error('Address in use, exiting...');
                    process.exit();
                } else {
                    throw err;
                }
            });

            server.listen(port, '0.0.0.0', function() {
                winston.info("TruDesk Ready");
                winston.info('TruDesk is now listening on port: ' + port);
            });

            callback();
        });
    };

})(WebServer);