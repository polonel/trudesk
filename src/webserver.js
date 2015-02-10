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

var nconf = require('nconf'),
    async = require('async'),
    express = require('express'),
    WebServer = express(),
    server,
    winston = require('winston'),
    middleware = require('./middleware'),
    routes = require('./routes'),

    //Load Events
    events = require('./emitter/events');


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
                    winston.error(err.message);
                    throw err;
                }
            });

            server.listen(port, '0.0.0.0', function() {
                winston.info("TruDesk Ready");
                winston.info('TruDesk is now listening on port: ' + port);

                callback();
            });
        });
    };

})(WebServer);