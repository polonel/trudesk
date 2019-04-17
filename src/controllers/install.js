/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var async = require('async')
var path = require('path')
var _ = require('lodash')
var winston = require('winston')
var pkg = require('../../package')
var Chance = require('chance')

var installController = {}

installController.content = {}

installController.index = function(req, res) {
    var content = {}
    content.title = 'Install Trudesk'
    content.layout = false

    content.bottom = 'Trudesk v' + pkg.version
    content.isDocker = process.env.TRUDESK_DOCKER || false

    res.render('install', content)
}

installController.mongotest = function(req, res) {
    var data = req.body
    var dbPassword = encodeURIComponent(data.password)
    var CONNECTION_URI =
        'mongodb+srv://' + data.username + ':' + dbPassword + '@' + data.host + '/' + data.database

    var child = require('child_process').fork(path.join(__dirname, '../../src/install/mongotest'), {
        env: { FORK: 1, NODE_ENV: global.env, MONGOTESTURI: CONNECTION_URI }
    })

    global.forks.push({ name: 'mongotest', fork: child })
    child.on('message', function(data) {
        if (data.error) return res.status(400).json({ success: false, error: data.error })

        return res.json({ success: true })
    })

    child.on('close', function() {
        winston.debug('MongoTest process terminated')
    })
}

installController.existingdb = function(req, res) {
    var data = req.body

    // Mongo
    var host = data.host
        // var port = data.port
    var database = data.database
        // var username = data.username
        // var password = data.password

    // Write Configfile
    var fs = require('fs')
    var configFile = path.join(__dirname, '../../config.json')

    var conf = {
        mongo: {
            host: host,
            // port: port,
            // username: username,
            // password: password,
            database: database
        }
    }

    fs.writeFile(configFile, JSON.stringify(conf, null, 4), function(err) {
        if (err) {
            winston.error('FS Error: ' + err.message)
            return res.status(400).json({ success: false, error: err.message })
        }

        return res.json({ success: true })
    })
}

installController.install = function(req, res) {
    var db = require('../database')
    var roleSchema = require('../models/role')
    var roleOrderSchema = require('../models/roleorder')
    var UserSchema = require('../models/user')
    var GroupSchema = require('../models/group')
    var Counters = require('../models/counters')
    var TicketTypeSchema = require('../models/tickettype')

    var data = req.body

    // Mongo
    var host = data['mongo[host]']
        // var port = data['mongo[port]']
    var database = data['mongo[database]']
        // var username = data['mongo[username]']
        // var password = data['mongo[password]']

    // Account
    var user = {
        username: data['account[username]'],
        password: data['account[password]'],
        passconfirm: data['account[cpassword]'],
        email: data['account[email]'],
        fullname: data['account[fullname]']
    }

    var dbPassword = encodeURIComponent(password)
    var conuri = 'mongodb+srv://' + username + ':' + dbPassword + '@' + host + '/' + database

    async.waterfall(
        [
            function(next) {
                db.init(function(err) {
                    return next(err)
                }, conuri)
            },
            function(next) {
                var Counter = new Counters({
                    _id: 'tickets',
                    next: 1001
                })

                Counter.save(function(err) {
                    return next(err)
                })
            },
            function(next) {
                var Counter = new Counters({
                    _id: 'reports',
                    next: 1001
                })

                Counter.save(function(err) {
                    return next(err)
                })
            },
            function(next) {
                var type = new TicketTypeSchema({
                    name: 'Issue'
                })

                type.save(function(err) {
                    return next(err)
                })
            },
            function(next) {
                var type = new TicketTypeSchema({
                    name: 'Task'
                })

                type.save(function(err) {
                    return next(err)
                })
            },
            function(next) {
                var defaults = require('../settings/defaults')
                var roleResults = {}
                async.parallel(
                    [
                        function(done) {
                            roleSchema.create({
                                    name: 'Admin',
                                    description: 'Default role for admins',
                                    grants: defaults.adminGrants
                                },
                                function(err, role) {
                                    if (err) return done(err)
                                    roleResults.adminRole = role
                                    return done()
                                }
                            )
                        },
                        function(done) {
                            roleSchema.create({
                                    name: 'Support',
                                    description: 'Default role for agents',
                                    grants: defaults.supportGrants
                                },
                                function(err, role) {
                                    if (err) return done(err)
                                    roleResults.supportRole = role
                                    return done()
                                }
                            )
                        },
                        function(done) {
                            roleSchema.create({
                                    name: 'Users',
                                    description: 'Default role for users',
                                    grants: defaults.userGrants
                                },
                                function(err, role) {
                                    if (err) return done(err)
                                    roleResults.userRole = role
                                    return done()
                                }
                            )
                        }
                    ],
                    function(err) {
                        return next(err, roleResults)
                    }
                )
            },
            function(roleResults, next) {
                GroupSchema.getGroupByName('Administrators', function(err, group) {
                    if (err) {
                        winston.error('Database Error: ' + err.message)
                        return next('Database Error:' + err.message)
                    }

                    if (!_.isNull(group) && !_.isUndefined(group) && !_.isEmpty(group)) {
                        return next(null, group)
                    }

                    // Create Admin Group
                    var adminGroup = new GroupSchema({
                        name: 'Administrators',
                        members: []
                    })

                    adminGroup.save(function(err) {
                        if (err) {
                            winston.error('Database Error:' + err.message)
                            return next('Database Error:' + err.message)
                        }

                        return next(null, adminGroup, roleResults)
                    })
                })
            },
            function(adminGroup, roleResults, next) {
                UserSchema.getUserByUsername(user.username, function(err, admin) {
                    if (err) {
                        winston.error('Database Error: ' + err.message)
                        return next('Database Error: ' + err.message)
                    }

                    if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
                        return next('Username: ' + user.username + ' already exists.')
                    }

                    if (user.password !== user.passconfirm) {
                        return next('Passwords do not match!')
                    }

                    var chance = new Chance()
                    var adminUser = new UserSchema({
                        username: user.username,
                        password: user.password,
                        fullname: user.fullname,
                        email: user.email,
                        role: roleResults.adminRole._id,
                        title: 'Administrator',
                        accessToken: chance.hash()
                    })

                    adminUser.save(function(err, savedUser) {
                        if (err) {
                            winston.error('Database Error: ' + err.message)
                            return next('Database Error: ' + err.message)
                        }

                        adminGroup.addMember(savedUser._id, function(err, success) {
                            if (err) {
                                winston.error('Database Error: ' + err.message)
                                return next('Database Error: ' + err.message)
                            }

                            if (!success) {
                                return next('Unable to add user to Administrator group!')
                            }

                            adminGroup.save(function(err) {
                                if (err) {
                                    winston.error('Database Error: ' + err.message)
                                    return next('Database Error: ' + err.message)
                                }

                                return next(null)
                            })
                        })
                    })
                })
            },
            function(next) {
                if (!process.env.TRUDESK_DOCKER) return next()
                var S = require('../models/setting')
                var installed = new S({
                    name: 'installed',
                    value: true
                })

                installed.save(function(err) {
                    if (err) {
                        winston.error('DB Error: ' + err.message)
                        return next('DB Error: ' + err.message)
                    }

                    return next()
                })
            },
            function(next) {
                if (process.env.TRUDESK_DOCKER) return next()
                    // Write Configfile
                var fs = require('fs')
                var configFile = path.join(__dirname, '../../config.json')

                var conf = {
                    mongo: {
                        host: host,
                        // port: port,
                        // username: username,
                        // password: password,
                        database: database
                    }
                }

                fs.writeFile(configFile, JSON.stringify(conf, null, 4), function(err) {
                    if (err) {
                        winston.error('FS Error: ' + err.message)
                        return next('FS Error: ' + err.message)
                    }

                    return next(null)
                })
            }
        ],
        function(err) {
            if (err) {
                return res.status(400).json({ success: false, error: err })
            }

            res.json({ success: true })
        }
    )
}

installController.restart = function(req, res) {
    var pm2 = require('pm2')
    pm2.connect(function(err) {
        if (err) {
            winston.error(err)
            res.status(400).send(err)
            return
        }
        pm2.restart('trudesk', function(err) {
            if (err) {
                res.status(400).send(err)
                return winston.error(err)
            }

            pm2.disconnect()
            res.send()
        })
    })
}

module.exports = installController