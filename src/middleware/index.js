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

var _               = require('lodash'),
    path            = require('path'),
    async           = require('async'),
    express         = require('express'),
    mongoose        = require('mongoose'),
    HandleBars      = require('handlebars').create(),
    hbs             = require('express-hbs'),
    hbsHelpers      = require('../helpers/hbs/helpers'),
    winston         = require('winston'),
    flash           = require('connect-flash'),
    bodyParser      = require('body-parser'),
    cookieParser    = require('cookie-parser'),
    favicon         = require('serve-favicon'),
    session         = require('express-session'),
    MongoStore      = require('connect-mongo')(session),
    passportConfig  = require('../passport')(),
    nconf           = require('nconf');


var middleware = {};

module.exports = function(app, db, callback) {
    middleware = require('./middleware')(app);
    app.disable('x-powered-by');

    app.set('views', path.join(__dirname, '../views/'));
    global.HandleBars = HandleBars;
    app.engine('hbs', hbs.express4({
        handlebars: HandleBars,
        defaultLayout: path.join(__dirname, '../views/layout/main.hbs'),
        partialsDir: [path.join(__dirname + '/../views/partials/'), path.join(__dirname + '/../views/subviews/reports')]
    }));
    app.set('view engine', 'hbs');
    hbsHelpers.register(hbs.handlebars);

    // app.use(favicon(nconf.get('base_dir') + '/public/img/favicon.ico'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use(function(req, res, next) {
        if (mongoose.connection.readyState !== 1) {
            var err = new Error('MongoDb Error');
            err.status = 503;
            return next(err);
        }

        return next();
    });

    var cookie = {
        httpOnly: true,
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
                saveUninitialized: false,
                resave: false
            }));

            next(null, sessionStore);
        },
        function(store, next) {
            app.use(passportConfig.initialize());
            app.use(passportConfig.session());
            app.use(flash());

            //CORS
            app.use(allowCrossDomain);
            //Mobile
            app.use('/mobile', express.static(path.join(__dirname, '../../', 'mobile')));

            app.use('/assets', express.static(nconf.get('base_dir') + '/public/uploads/assets'));
            app.use('/uploads', middleware.redirectToLogin, express.static(nconf.get('base_dir') + '/public/uploads'));

            app.use(express.static(nconf.get('base_dir') + '/public'));

            //Remove to enable plugins
            //next(null, store);
            global.plugins = [];
            var dive = require('dive');
            dive(path.join(__dirname, '../../plugins'), {directories: true, files: false, recursive: false}, function(err, dir) {
               if (err) throw err;
               var fs = require('fs');
               if (fs.existsSync(path.join(dir, 'plugin.json'))) {
                   var plugin = require(path.join(dir, 'plugin.json'));
                   if (!_.isUndefined(_.find(global.plugins, {'name': plugin.name})))
                       throw new Error('Unable to load plugin with duplicate name: ' + plugin.name);

                   global.plugins.push({name: plugin.name.toLowerCase(), version: plugin.version});
                   var pluginPublic = path.join(dir, '/public');
                   app.use('/plugins/' + plugin.name, express.static(pluginPublic));
                   winston.debug('Detected Plugin: ' + plugin.name.toLowerCase() + '-' + plugin.version);
               }
            }, function() {
                next(null, store);
            });
        }
    ], function(err, s) {
        if (err) {
            winston.error(err);
            throw new Error(err);
        }

        callback(middleware, s);
    });
};

function allowCrossDomain(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,accesstoken');

    if (req.method === 'OPTIONS') 
        res.sendStatus(200);
     else 
        next();
    
}