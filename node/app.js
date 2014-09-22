var express = require('express');
var hbs = require('express-hbs');
var hbshelpers = require('./src/hbs/helpers');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('winston');
var app = express();

//Database
var mongoose = require('mongoose');
var mDb;
mongoose.connect('mongodb://trudesk:#TruDesk$@127.0.0.1/trudesk', function(err, _db) {
    if (err) {
        winston.error("TruDesk could not connect to your Mongo database. Mongo returned the following error: " + err.message);
        process.exit();
    }

    mDb = _db;

    //Sessions
    var sessionSecret = 'trudesk$123#SessionKeY!2387';
    var sessionMaxAge = 28800000;

    app.use(session({
        secret: sessionSecret,
        cookie: {
            maxAge: sessionMaxAge
        },
        store: new MongoStore({
            db: mDb
        }),
        saveUninitialized: false,
        resave: true
    }));

    app.use(passportConfig.initialize());
    app.use(passportConfig.session());
    app.use(flash());

});

//Passport
var passportConfig = require('./src/passport/passport')();
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var flash = require('connect-flash');

var server = require('http').Server(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs.express3({
    defaultLayout: './views/layout/main.hbs',
    partialsDir: [__dirname + '/views/partials']
}));
app.set('view engine', 'hbs');
hbshelpers.register(hbs.handlebars);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var routes = require('./routes/index');
app.use('/', routes);

app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            layout: false
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        layout: false
    });
});


module.exports = app;
