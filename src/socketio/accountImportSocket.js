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
var _ = require('lodash')
var async = require('async')
var winston = require('winston')
var utils = require('../helpers/utils')
var UserSchema = require('../models/user')
var permissions = require('../permissions')

var events = {}

function register (socket) {
  events.onImportCSV(socket)
  events.onImportJSON(socket)
  events.onImportLDAP(socket)
}

function eventLoop () {}

events.onImportCSV = function (socket) {
  socket.on('$trudesk:accounts:import:csv', function (data) {
    var authUser = socket.request.user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      // Send Error Socket Emit
      winston.warn('[$trudesk:accounts:import:csv] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    var addedUsers = data.addedUsers
    var updatedUsers = data.updatedUsers

    var completedCount = 0
    async.series(
      [
        function (next) {
          async.eachSeries(
            addedUsers,
            function (cu, done) {
              var data = {
                type: 'csv',
                totalCount: addedUsers.length + updatedUsers.length,
                completedCount: completedCount,
                item: {
                  username: cu.username,
                  state: 1
                }
              }

              utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

              var user = new UserSchema({
                username: cu.username,
                fullname: cu.fullname,
                email: cu.email,
                password: 'Password1!'
              })

              if (!_.isUndefined(cu.role)) {
                user.role = cu.role
              } else {
                user.role = 'user'
              }

              if (!_.isUndefined(cu.title)) {
                user.title = cu.title
              }

              user.save(function (err) {
                if (err) {
                  winston.warn(err)
                  data.item.state = 3
                  utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                } else {
                  completedCount++
                  // Send update
                  data.completedCount = completedCount
                  data.item.state = 2 // Completed
                  setTimeout(function () {
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

                    done()
                  }, 150)
                }
              })
            },
            function () {
              return next()
            }
          )
        },
        function (next) {
          _.each(updatedUsers, function (uu) {
            var data = {
              type: 'csv',
              totalCount: addedUsers.length + updatedUsers.length,
              completedCount: completedCount,
              item: {
                username: uu.username,
                state: 1 // Starting
              }
            }
            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
            UserSchema.getUserByUsername(uu.username, function (err, user) {
              if (err) {
                console.log(err)
              } else {
                user.fullname = uu.fullname
                user.title = uu.title
                user.email = uu.email
                if (!_.isUndefined(uu.role)) {
                  user.role = uu.role
                }

                user.save(function (err) {
                  if (err) {
                    console.log(err)
                    data.item.state = 3
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                  } else {
                    completedCount++
                    data.item.state = 2
                    data.completedCount = completedCount
                    setTimeout(function () {
                      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                    }, 150)
                  }
                })
              }
            })
          })

          return next()
        }
      ],
      function () {}
    )
  })
}

events.onImportJSON = function (socket) {
  socket.on('$trudesk:accounts:import:json', function (data) {
    var authUser = socket.request.user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      // Send Error Socket Emit
      winston.warn('[$trudesk:accounts:import:json] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    var addedUsers = data.addedUsers
    var updatedUsers = data.updatedUsers

    var completedCount = 0
    async.series(
      [
        function (next) {
          async.eachSeries(
            addedUsers,
            function (cu, done) {
              var data = {
                type: 'json',
                totalCount: addedUsers.length + updatedUsers.length,
                completedCount: completedCount,
                item: {
                  username: cu.username,
                  state: 1
                }
              }

              utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

              var user = new UserSchema({
                username: cu.username,
                fullname: cu.fullname,
                email: cu.email,
                password: 'Password1!'
              })

              if (!_.isUndefined(cu.role)) {
                user.role = cu.role
              } else {
                user.role = 'user'
              }

              if (!_.isUndefined(cu.title)) {
                user.title = cu.title
              }

              user.save(function (err) {
                if (err) {
                  winston.warn(err)
                  data.item.state = 3
                  utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                } else {
                  completedCount++
                  // Send update
                  data.completedCount = completedCount
                  data.item.state = 2 // Completed
                  setTimeout(function () {
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

                    done()
                  }, 150)
                }
              })
            },
            function () {
              return next()
            }
          )
        },
        function (next) {
          _.each(updatedUsers, function (uu) {
            var data = {
              type: 'json',
              totalCount: addedUsers.length + updatedUsers.length,
              completedCount: completedCount,
              item: {
                username: uu.username,
                state: 1 // Starting
              }
            }
            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
            UserSchema.getUserByUsername(uu.username, function (err, user) {
              if (err) {
                console.log(err)
              } else {
                user.fullname = uu.fullname
                user.title = uu.title
                user.email = uu.email
                if (!_.isUndefined(uu.role)) {
                  user.role = uu.role
                }

                user.save(function (err) {
                  if (err) {
                    console.log(err)
                    data.item.state = 3
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                  } else {
                    completedCount++
                    data.item.state = 2
                    data.completedCount = completedCount
                    setTimeout(function () {
                      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                    }, 150)
                  }
                })
              }
            })
          })

          return next()
        }
      ],
      function () {}
    )
  })
}

events.onImportLDAP = function (socket) {
  socket.on('$trudesk:accounts:import:ldap', function (data) {
    var authUser = socket.request.user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      // Send Error Socket Emit
      winston.warn('[$trudesk:accounts:import:ldap] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    var addedUsers = data.addedUsers
    var updatedUsers = data.updatedUsers
    var defaultUserRole = null
    var completedCount = 0

    async.series(
      [
        function (next) {
          var settingSchema = require('../models/setting')
          settingSchema.getSetting('role:user:default', function (err, setting) {
            if (err || !setting) {
              utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
                error: 'Default user role not set. Please contact an Administrator.'
              })

              return next('Default user role not set. Please contact an Administrator')
            }

            defaultUserRole = setting.value
            return next()
          })
        },
        function (next) {
          async.eachSeries(
            addedUsers,
            function (lu, done) {
              var data = {
                type: 'ldap',
                totalCount: addedUsers.length + updatedUsers.length,
                completedCount: completedCount,
                item: {
                  username: lu.sAMAccountName,
                  state: 1 // Starting
                }
              }

              utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

              var user = new UserSchema({
                username: lu.sAMAccountName,
                fullname: lu.displayName,
                email: lu.mail,
                title: lu.title,
                role: defaultUserRole,
                password: 'Password1!'
              })

              user.save(function (err) {
                if (err) {
                  winston.warn(err)
                  data.item.state = 3
                  utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                } else {
                  completedCount++
                  // Send update
                  data.completedCount = completedCount
                  data.item.state = 2 // Completed
                  setTimeout(function () {
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)

                    done()
                  }, 150)
                }
              })
            },
            function () {
              return next()
            }
          )
        },
        function (next) {
          _.each(updatedUsers, function (uu) {
            var data = {
              type: 'ldap',
              totalCount: addedUsers.length + updatedUsers.length,
              completedCount: completedCount,
              item: {
                username: uu.username,
                state: 1 // Starting
              }
            }
            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
            UserSchema.getUser(uu._id, function (err, user) {
              if (err) {
                console.log(err)
              } else {
                user.fullname = uu.fullname
                user.title = uu.title
                user.email = uu.email

                user.save(function (err) {
                  if (err) {
                    console.log(err)
                    data.item.state = 3
                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                  } else {
                    completedCount++
                    data.item.state = 2
                    data.completedCount = completedCount
                    setTimeout(function () {
                      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data)
                    }, 150)
                  }
                })
              }
            })
          })

          return next()
        }
      ],
      function () {}
    )
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
