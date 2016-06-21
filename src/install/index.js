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

'use strict';

var _       = require('underscore');
var async   = require('async');
var fs      = require('fs');
var path    = require('path');
var prompt  = require('prompt');
var winston = require('winston');
var nconf   = require('nconf');

var install = {};
var questions = {};

questions.main = [
    {
        name: 'url',
        description: 'URL used to access this trudesk server'.magenta,
        'default':
            nconf.get('url') ||
            (nconf.get('base_url') ? (nconf.get('base_url') + (nconf.get('use_port') ? ':' + nconf.get('port') : '')) : null) ||
                'http://localhost:8118',
        pattern: /^http(?:s)?:\/\//,
        message: 'Base URL must begin with \'http://\' or \'https://\''
    }
];

questions.mongo = [
    {
        name: 'mongo:host',
        description: 'Host IP or address of your MongoDB server',
        'default': nconf.get('mongo:host') || '127.0.0.1'
    },
    {
        name: 'mongo:port',
        description: 'Host port of your MongoDB server',
        'default': nconf.get('mongo:port') || 27017
    },
    {
        name: 'mongo:username',
        description: 'MongoDB username',
        default: nconf.get('mongo:username') || ''
    },
    {
        name: 'mongo:password',
        description: 'Password for your MongoDB user',
        hidden: true,
        default: nconf.get('mongo:password') || ''
    },
    {
        name: 'mongo:database',
        description: 'Database to use',
        'default': nconf.get('mongo:database') || 0
    }
];

questions.mailer = [
    {
        name: 'mailer:enable',
        description: 'Enable sending of mail items',
        default: nconf.get('mailer:enable') || true
    },
    {
        name: 'mailer:host',
        description: 'Host IP or address of your SMTP host',
        default: nconf.get('mailer:host') || '127.0.0.1'
    },
    {
        name: 'mailer:port',
        description: 'Host port of your SMTP server',
        default: nconf.get('mailer:port') || 25
    },
    {
        name: 'mailer:username',
        description: 'SMTP Server username'
    },
    {
        name: 'mailer:password',
        description: 'Password for your SMTP user',
        hidden: true
    },
    {
        name: 'mailer:fromAddress',
        description: 'Send Mail As (from address)'
    },
    {
        name: 'mailer:check:enable',
        description: 'Enable checking of email account for new tickers',
        default: nconf.get('mailer:check:enable') || true
    }
];

questions.mailerCheck = [
    {
        name: 'mailer:check:host',
        description: 'Host IP or address of Mail Server',
        default: nconf.get('mailer:check:host') || '127.0.0.1'
    },
    {
        name: 'mailer:check:user',
        description: 'User mailbox to check mail',
        default: nconf.get('mailer:check:user') || ''
    },
    {
        name: 'mailer:check:password',
        description: 'Password for User mailbox',
        hidden: true
    }
];

questions.settings = [
    {
        name: 'settings:showOverdue',
        description: 'Show ticket flash when overdue',
        default: nconf.get('settings:showOverdue') || true
    }
];

questions.optional = [
    {
        name: 'port',
        default: 8118
    }
];

function checkSetupFlag(next) {
    var setupVal;
    try {
        setupVal = JSON.parse(nconf.get('setup'));
    } catch(e) {
        setupVal = undefined;
    }

    if (setupVal && setupVal instanceof Object) {
        if (setupVal['admin:username'] && setupVal['admin:password'] && setupVal['admin:password:confirm'] && setupVal['admin:email']) {
            install.values = setupVal;
            next();
        } else {
            winston.error('Required values are missing for automated setup:');
            if (!setupVal['admin:username']) {
                winston.error('  admin:username');
            }
            if (!setupVal['admin:password']) {
                winston.error('  admin:password');
            }
            if (!setupVal['admin:password:confirm']) {
                winston.error('  admin:password:confirm');
            }
            if (!setupVal['admin:email']) {
                winston.error('  admin:email');
            }

            process.exit();
        }
    } else {
        next();
    }
}

function setupConfig(next) {
    prompt.start();
    prompt.message = '';
    prompt.delimiter = '';

    if (!install.values) {
        var allQuestions = questions.main.concat(questions.optional);
        async.waterfall([
            function(done) {
                prompt.get(allQuestions, function(err, config) {
                    if (err) return done(err);

                    done(null, config);
                });
            },
            function(config, done) {
                prompt.get(questions.mongo, function(err, dbConfig) {
                    if (err) return done(err);

                    config.mongo = {
                        host: dbConfig['mongo:host'],
                        port: dbConfig['mongo:port'],
                        username: dbConfig['mongo:username'],
                        password: dbConfig['mongo:password'],
                        database: dbConfig['mongo:database']
                    };

                    done(null, config);
                });
            },
            function(config, done) {
                prompt.get(questions.mailer, function(err, mailerConfig) {
                    if (err) return done(err);

                    config.mailer = {
                        enable: mailerConfig['mailer:enable'],
                        host: mailerConfig['mailer:host'],
                        port: mailerConfig['mailer:port'],
                        username: mailerConfig['mailer:username'],
                        password: mailerConfig['mailer:password'],
                        from: mailerConfig['mailer:fromAddress'],
                        check: {
                            enable: mailerConfig['mailer:check:enable']
                        }
                    };

                    if (config.mailer.check.enable == true) {
                        prompt.get(questions.mailerCheck, function(err, mailerCheckConfig) {
                            if (err) return done(err);

                            config.mailer.check = {
                                enable: true,
                                host: mailerCheckConfig['mailer:check:host'],
                                user: mailerCheckConfig['mailer:check:user'],
                                password: mailerCheckConfig['mailer:check:password']
                            };

                            return done(null, config);
                        });

                    } else {
                        return done(null, config);
                    }
                });
            },
            function(config, done) {
                prompt.get(questions.settings, function(err, settingsConfig) {
                    if (err) return done(err);

                    config.settings = {
                        showOverdue: settingsConfig['settings:showOverdue']
                    };

                    done(null, config);
                });
            }
        ], function(err, config) {
            if (err) {
                process.stdout.write('\n\n');
                winston.warn('trudesk setup ' + err.message);
                process.exit();
            }

            completeConfigSetup(err, config, next);
        });
    }
}

function completeConfigSetup(err, config, next) {
    if (err) {
        return next(err);
    }

    install.save(config, function(err) {
        if (err) {
            return next(err);
        }

        next();
    })
}

function createAdministrator(next) {
    var db = require('../database');
    db.init(function(err) {
        if (err) {
            winston.error('Database Error: ' + err.message);
            process.exit();
        } else {
            var Group = require('../models/group');
            Group.getGroupByName('Administrators', function(err, group) {
                if (err) {
                    winston.error('Database Error: ' + err.message);
                    process.exit();
                }

                if (!_.isNull(group) && !_.isUndefined(group) && !_.isEmpty(group)) {
                    winston.info('Administrator Group Already Exists.');

                    createAdmin(next);
                } else {
                    //Create Admin Group
                    var adminGroup = new Group({
                        name: 'Administrators',
                        members: []
                    });

                    adminGroup.save(function(err) {
                        if (err) {
                            winston.error('Database Error:' + err.message);
                            process.exit();
                        }

                        createAdmin(next);
                    });
                }
            });
        }
    });
}

function createAdmin(next) {
    var db = require('../database');
    var User = require('../models/user');
    var Group = require('../models/group');

    db.init(function(err) {
        if (err) {
            winston.error('Database Error: ' + err.message);
            process.exit();
        }

        User.getUserByUsername('Administrator', function(err, admin) {
            if (err) {
                winston.error('Database Error: ' + err.message);
                process.exit();
            }

            if (!_.isNull(admin)) {
                winston.info('Administrator Account already Exists');

                next();
            } else {
                //Create User and Add to group.
                var user = new User({
                    username:   'Administrator',
                    password:   'Passw0rd',
                    fullname:   'Administrator',
                    email:      'admin@trudesk.io',
                    role:       'admin',
                    title:      'Administrator'
                });

                user.save(function(err, aUser) {
                    if (err) {
                        winston.error('Database Error: ' + err.message);
                        process.exit();
                    }

                    Group.getGroupByName('Administrators', function(err, adminGroup) {
                        if (err) {
                            winston.error('Database Error: ' + err.message);
                            process.exit();
                        }

                        if (!_.isNull(adminGroup) && !_.isUndefined(adminGroup) && !_.isEmpty(adminGroup)) {
                            adminGroup.addMember(aUser._id, function(err, success) {
                                if (err) {
                                    winston.error('Database Error: ' + err.message);
                                    process.exit();
                                }

                                if (!success) {
                                    winston.error('Unable to add Administrator to group Administrators. Aborting...');
                                    process.exit();
                                }

                                adminGroup.save(function(err) {
                                    if (err) {
                                        winston.error('Database Error: ' + err.message);
                                        process.exit();
                                    }

                                    next();
                                });
                            });
                        }
                    });
                });
            }
        });
    });
}

function createCounter(next) {
    var db = require('../database');
    var countersSchema = require('../models/counters');

    db.init(function(err) {
        if (err) {
            return next(err);
        }

        async.parallel([
            function(cb) {
               countersSchema.find({_id: 'tickets'}, function(err, c) {
                   if (err) return cb(err);
                   if (!c) {
                       var Counter = new countersSchema({
                           _id: "tickets",
                           next: 1001
                       });

                       Counter.save(function(err) {
                           return cb(err);
                       });
                   } else {
                       return cb();
                   }
               });
            },
            function(cb) {
                countersSchema.find({_id: 'reports'}, function(err, r) {
                    if (err) return cb(err);
                    if (!r) {
                        var Counter = countersSchema({
                            _id: '_reports',
                            next: 1001
                        });

                        Counter.save(function(err) {
                            return cb(err);
                        });
                    } else {
                        return cb();
                    }
                });
            }
        ], function(err) {
            next(err);
        });
    });
}

function createDefaultTicketTypes(next) {
    var db = require('../database');
    var ticketTypeSchema = require('../models/tickettype');

    db.init(function(err) {
        if (err) {
            return next(err);
        }

        async.parallel([
            function(cb) {
                ticketTypeSchema.find({name: 'Issue'}, function(err, t) {
                    if (err) return cb(err);
                    if (!t) {
                        var type = new ticketTypeSchema({
                            name: 'Issue'
                        });

                        type.save(function(err) {
                            return cb(err);
                        });
                    } else {
                        return cb();
                    }
                });
            },
            function(cb) {
                ticketTypeSchema.find({name: 'Task'}, function(err, t) {
                    if (err) return cb(err);
                    if (!t) {
                        var type = new ticketTypeSchema({
                            name: 'Task'
                        });

                        type.save(function(err) {
                            return cb(err);
                        });
                    } else {
                        return cb();
                    }
                });
            }
        ], function(err) {
            return next(err);
        });
    });
}

install.setup = function(callback) {
    async.series([
        //checkSetupFlag,
        //setupConfig,
        createAdministrator,
        createCounter,
        //createDefaultTicketTypes

    ], function(err) {
        if (err) {
            winston.err('trudesk Setup Aborted. ' + err.message);
            process.exit();
        } else {
            callback();
        }
    });
};

install.save = function(conf, callback) {
    return callback();
    //NO NEED FOR THIS ON DOCKER
    var configPath = path.join(__dirname, '../../config.json');

    if (nconf.get('config')) {
        configPath = path.resolve(__dirname, '../', nconf.get('config'));
    }

    fs.writeFile(configPath, JSON.stringify(conf, null, 4), function(err) {
        if (err) {
            winston.error('Error Saving Configuration! ' + err.message);
            return callback(err);
        }

        winston.info('Configuration Saved - OK!');

        nconf.file({
            file: path.join(__dirname, '../../', 'config.json')
        });

        callback();
    })
};

module.exports = install;