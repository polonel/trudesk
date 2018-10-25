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
    nconf           = require('nconf'),
    express         = require('express'),
    i18next         = require('i18next'),
    i18nextMiddleware=require('i18next-express-middleware'),
    i18nextBackend  = require('i18next-node-fs-backend'),
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
    passportConfig  = require('../passport')();


var middleware = {};

module.exports = function(app, db, callback) {
    middleware = require('./middleware')(app);
    app.disable('x-powered-by');

    i18next
        .use(i18nextBackend)
        .use(i18nextMiddleware.LanguageDetector)
        .init({
            backend: {
                loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
            },
            // lng: 'en_US',
            // lng: 'de',
            lng: nconf.get('locale'),
            preload: ['en', 'de'],
            ns: ['account', 'client', 'common'],
            defaultNS: 'client',
            missingKeyHandler: function(lng, ns, key, fallbackValue) {
                var fs = require('fs');
                var lngFile = path.join(__dirname, '../../locales/' + lng + '/' + ns + '.json');
                var obj = JSON.parse(fs.readFileSync(lngFile));
                var kObj = {};
                kObj[key] = fallbackValue;
                var k = _.extend(obj, kObj);
                fs.writeFileSync(lngFile, JSON.stringify(k, null, 2));
            },
            saveMissing: true
        });

    app.use(i18nextMiddleware.handle(i18next));
    app.use('/locales/', express.static(path.join(__dirname, '../../locales')));

    app.set('views', path.join(__dirname, '../views/'));
    global.HandleBars = HandleBars;
    app.engine('hbs', hbs.express4({
        handlebars: HandleBars,
        defaultLayout: path.join(__dirname, '../views/layout/main.hbs'),
        partialsDir: [path.join(__dirname + '/../views/partials/'), path.join(__dirname + '/../views/subviews/reports')]
    }));
    app.set('view engine', 'hbs');
    hbsHelpers.register(hbs.handlebars);

    app.use(favicon(path.join(__dirname, '../../', 'public/img/favicon.ico')));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    // i18n
    global.i18next = i18next;
    hbs.handlebars.registerHelper('__', function(key, options) {
        return new hbs.handlebars.SafeString(i18next.t(key, options.hash));
    });

    hbs.handlebars.registerHelper('t', function(key, options) {
        return new hbs.handlebars.SafeString(i18next.t(key, options.hash));
    });

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

            //Load after Passport!!
            app.use('/uploads/tickets', function(req, res, next) {
                if (!req.user) 
                    return res.redirect('/');

                return next();
            });

            //CORS
            app.use(allowCrossDomain);
            //Mobile
            app.use('/mobile', express.static(path.join(__dirname, '../../', 'mobile')));

            app.use('/uploads/tickets', middleware.redirectToLogin, express.static(path.resolve(__dirname, '/public/uploads/tickets')));
            app.use('/uploads/users', middleware.redirectToLogin, express.static(path.resolve(__dirname, '/public/uploads/users')));
            
            app.use(express.static(path.join(__dirname, '../../', 'public')));

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