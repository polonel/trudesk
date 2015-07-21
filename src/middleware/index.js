/*
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

    app.use(favicon(path.join(__dirname, '../../', 'public/img/favicon.ico')));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use(function(req, res, next) {
        //todo: Set reconnection here
        if (mongoose.connection.readyState !== 1) {
            var err = new Error('MongoDb Error');
            err.status = 503;
            next(err);
            return;
        }

        next();
    });

    var cookie = {
        maxAge: (1000 * 60 * 60 * 24) * 365 // 1 year
    };

    var sessionSecret = 'trudesk$123#SessionKeY!2387';
    async.waterfall([
        function(next) {
            var sessionStore = new MongoStore({mongooseConnection: db.connection, autoReconnect: true });
            app.use(session({
                secret: sessionSecret,
                cookie: cookie,
                store: sessionStore,
                saveUninitialized: true,
                resave: true
            }));

            next(null, sessionStore);
        },
        function(store, next) {
            app.use(passportConfig.initialize());
            app.use(passportConfig.session());
            app.use(flash());

            //Load after Passport!!
            app.use('/uploads/tickets', function(req, res, next) {
                if (!req.user) {
                    return res.redirect('/');
                }

                next();
            });
            app.use('/uploads/tickets', express.static(path.join(__dirname, '../../', 'public', 'uploads', 'tickets')));

            app.use(express.static(path.join(__dirname, '../../', 'public')));

            next(null, store);
        }
    ], function(err, s) {
        if (err) {
            winston.error(err);
            process.exit();
        }

        callback(middleware, s);
    });
};