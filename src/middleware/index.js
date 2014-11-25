var db = require('../database'),
    path = require('path'),
    async = require('async'),
    express = require('express'),
    hbs = require('express-hbs'),
    hbsHelpers = require('../helpers/hbs/helpers'),
    winston = require('winston'),
    flash = require('connect-flash'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    favicon = require('serve-favicon'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    passportConfig = require('../passport')(),
    logger = require('morgan');


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