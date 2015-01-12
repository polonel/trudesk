/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
========================================================================
    Created:    12/25/2014
    Author:     Chris Brame


 */

var path            = require('path'),
    async           = require('async'),
    express         = require('express'),
    mongoose        = require('mongoose'),
    hbs             = require('express-hbs'),
    hbsHelpers      = require('../helpers/hbs/helpers'),
    winston         = require('winston'),
    flash           = require('connect-flash'),
    bodyParser      = require('body-parser'),
    cookieParser    = require('cookie-parser'),
    multer          = require('multer'),
    favicon         = require('serve-favicon'),
    session         = require('express-session'),
    MongoStore      = require('connect-mongo')(session),
    passportConfig  = require('../passport')(),
    logger          = require('morgan');


var middleware = {};
module.exports = function(app, db, callback) {
    middleware = require('./middleware')(app);

    app.set('views', path.join(__dirname, '../views/'));
    app.engine('hbs', hbs.express3({
        defaultLayout: path.join(__dirname, '../views/layout/main.hbs'),
        partialsDir: [path.join(__dirname + '/../views/partials/')]
    }));
    app.set('view engine', 'hbs');
    hbsHelpers.register(hbs.handlebars);

    // uncomment after placing your favicon in /public
    //app.use(favicon(__dirname + '/public/favicon.ico'));
    //app.use(logger('dev'));
    app.use(express.static(path.join(__dirname, '../../', 'public')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(function(req, res, next) {
        if (mongoose.connection.readyState !== 1) {
            var err = new Error('MongoDb Error');
            err.status = 503;
            next(err);
            return;
        }

        next();
    });

    var cookie = {
        maxAge: 1000 * 60 * 60 * 24
    };

    var sessionSecret = 'trudesk$123#SessionKeY!2387';
    var sessionStore = new MongoStore({mongoose_connection: db.connection, auto_reconnect: true }, function(e) {
        app.use(session({
            secret: sessionSecret,
            cookie: cookie,
            store: sessionStore,
            saveUninitialized: true,
            resave: true
        }));

        app.use(passportConfig.initialize());
        app.use(passportConfig.session());
        app.use(flash());

        callback(middleware, sessionStore);
    });
};