'use strict';

var _       = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var prompt = require('prompt');
var winston = require('winston');
var nconf = require('nconf');

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
        description: 'MongoDB username'
    },
    {
        name: 'mongo:password',
        description: 'Password for your MongoDB user',
        hidden: true
    },
    {
        name: 'mongo:database',
        description: 'Database to use',
        'default': nconf.get('mongo:database') || 0
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
        prompt.get(allQuestions, function(err, config) {
            if (err) {
                process.stdout.write('\n\n');
                winston.warn('trudesk setup ' + err.message);
                process.exit();
            }

            prompt.get(questions.mongo, function(err, dbConfig) {
                if (err) {
                    process.stdout.write('\n\n');
                    winston.warn('trudesk setup ' + err.message);
                    process.exit();
                }

                config.mongo = {
                    host: dbConfig['mongo:host'],
                    port: dbConfig['mongo:port'],
                    username: dbConfig['mongo:username'],
                    password: dbConfig['mongo:password'],
                    database: dbConfig['mongo:database']
                };

                completeConfigSetup(err, config, next);
            });
        });


    } else {

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

            if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
                winston.info('Administrator Account already Exists');

                next();
            } else {
                var questions = [{
                    name: 'username',
                    description: 'Administrator username',
                    required: true,
                    type: 'string'
                }, {
                    name: 'fullname',
                    description: 'Administrator Fullname',
                    required: true,
                    type: 'string'
                }, {
                    name: 'email',
                    description: 'Administrator email address',
                    pattern: /.+@.+/,
                    required: true
                }],
                passwordQuestions = [{
                    name: 'password',
                    description: 'Password',
                    required: true,
                    hidden: true,
                    type: 'string'
                }, {
                    name: 'password:confirm',
                    description: 'Confirm passowrd',
                    required: true,
                    hidden: true,
                    type: 'string'
                }],
                success = function(err, results) {
                    if (!results) {
                        return new Error('aborted');
                    }

                    if (results['password:confirm'] !== results.password) {
                        winston.warn('Passwords did not match, please try again');
                        return retryPassword(results);
                    }

                    //Create User and Add to group.

                    var user = new User({
                        username:   results.username,
                        password:   results.password,
                        fullname:   results.fullname,
                        email:      results.email,
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

                },
                retryPassword = function(oResults) {
                    prompt.get(passwordQuestions, function(err, results) {
                        if (!results) {
                            return new Error('aborted');
                        }

                        oResults.password = results.password;
                        oResults['password:confirm'] = results['password:confirm'];

                        success(err, oResults);
                    });
                };

                questions = questions.concat(passwordQuestions);

                if (!install.values) {
                    prompt.get(questions, success);
                } else {
                    var results = {
                        username: install.values['admin:username'],
                        email: install.values['admin:email'],
                        password: install.values['admin:password'],
                        'password:confirm': install.values['admin:password:confirm']
                    };

                    success(null, results);
                }
            }
        });
    });
}

install.setup = function(callback) {
    async.series([
        checkSetupFlag,
        setupConfig,
        createAdministrator

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