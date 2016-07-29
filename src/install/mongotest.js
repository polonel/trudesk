var database = require('../database');
var winston = require('winston');

global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,8) + ' [Child:MongoTest:' + global.process.pid + ']';
    },
    level: global.env === 'production' ? 'info' : 'verbose'
});

(function() {
    var CONNECTION_URI = process.env.MONGOTESTURI;
    if (!CONNECTION_URI) return process.send({error: {message: 'Invalid connection uri'}});
    var options = { server: { auto_reconnect: false, socketOptions: { connectTimeoutMS: 5000 } }};
    database.init(function(e, db) {
        if (e) return process.send({error: e});

        if (!db)
            return process.send({error: {message: 'Unable to open database'}});

        process.send({success: true});

    }, CONNECTION_URI, options);
})();