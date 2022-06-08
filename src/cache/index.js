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

const NodeCache = require('node-cache')
const async = require('async')
const path = require('path')
const nconf = require('nconf')
const _ = require('lodash')
const winston = require('../logger')
const moment = require('moment-timezone')

const truCache = {}
let cache

global.env = process.env.NODE_ENV || 'production'

function loadConfig () {
  nconf.file({
    file: path.join(__dirname, '/../../config.yml'),
    format: require('nconf-yaml')
  })

  nconf.defaults({
    base_dir: __dirname
  })
}

let refreshTimer
let lastUpdated = moment.utc().tz(process.env.TIMEZONE || 'America/New_York')

truCache.init = function (callback) {
  cache = new NodeCache({
    checkperiod: 0
  })

  truCache.refreshCache(function () {
    winston.debug('Cache Loaded')
    // restartRefreshClock()

    return callback()
  })
}

function restartRefreshClock () {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  lastUpdated = moment()

  refreshTimer = setInterval(function () {
    truCache.refreshCache()
    winston.debug('Refreshing Cache...')
  }, 55 * 60 * 1000)
}

truCache.refreshCache = function (callback) {
  async.waterfall(
    [
      function (done) {
        const ticketSchema = require('../models/ticket')
        ticketSchema.getForCache(function (e, tickets) {
          if (e) return done(e)
          winston.debug('Pulled ' + tickets.length)

          return done(null, tickets)
        })
      },

      function (tickets, cb) {
        async.parallel(
          [
            function (done) {
              const ticketStats = require('./ticketStats')
              ticketStats(tickets, function (err, stats) {
                if (err) return done(err)
                const expire = 3600 // 1 hour
                cache.set('tickets:overview:lastUpdated', stats.lastUpdated, expire)

                cache.set('tickets:overview:e30:ticketCount', stats.e30.tickets, expire)
                cache.set('tickets:overview:e30:closedTickets', stats.e30.closedTickets, expire)
                cache.set('tickets:overview:e30:responseTime', stats.e30.avgResponse, expire)
                cache.set('tickets:overview:e30:graphData', stats.e30.graphData, expire)

                cache.set('tickets:overview:e60:ticketCount', stats.e60.tickets, expire)
                cache.set('tickets:overview:e60:closedTickets', stats.e60.closedTickets, expire)
                cache.set('tickets:overview:e60:responseTime', stats.e60.avgResponse, expire)
                cache.set('tickets:overview:e60:graphData', stats.e60.graphData, expire)

                cache.set('tickets:overview:e90:ticketCount', stats.e90.tickets, expire)
                cache.set('tickets:overview:e90:closedTickets', stats.e90.closedTickets, expire)
                cache.set('tickets:overview:e90:responseTime', stats.e90.avgResponse, expire)
                cache.set('tickets:overview:e90:graphData', stats.e90.graphData, expire)

                cache.set('tickets:overview:e180:ticketCount', stats.e180.tickets, expire)
                cache.set('tickets:overview:e180:closedTickets', stats.e180.closedTickets, expire)
                cache.set('tickets:overview:e180:responseTime', stats.e180.avgResponse, expire)
                cache.set('tickets:overview:e180:graphData', stats.e180.graphData, expire)

                cache.set('tickets:overview:e365:ticketCount', stats.e365.tickets, expire)
                cache.set('tickets:overview:e365:closedTickets', stats.e365.closedTickets, expire)
                cache.set('tickets:overview:e365:responseTime', stats.e365.avgResponse, expire)
                cache.set('tickets:overview:e365:graphData', stats.e365.graphData, expire)

                return done()
              })
            },
            function (done) {
              const tagStats = require('./tagStats')
              async.parallel(
                [
                  function (c) {
                    tagStats(tickets, 30, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:30:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 60, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:60:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 90, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:90:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 180, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:180:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 365, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:365:usage', stats, 3600)

                      return c()
                    })
                  },
                  function (c) {
                    tagStats(tickets, 0, function (err, stats) {
                      if (err) return c(err)

                      cache.set('tags:0:usage', stats, 3600)

                      return c()
                    })
                  }
                ],
                function (err) {
                  return done(err)
                }
              )
            },
            function (done) {
              const quickStats = require('./quickStats')
              quickStats(tickets, function (err, stats) {
                if (err) return done(err)

                cache.set('quickstats:mostRequester', stats.mostRequester, 3600)
                cache.set('quickstats:mostCommenter', stats.mostCommenter, 3600)
                cache.set('quickstats:mostAssignee', stats.mostAssignee, 3600)
                cache.set('quickstats:mostActiveTicket', stats.mostActiveTicket, 3600)

                return done()
              })
            }
          ],
          function (err) {
            tickets = null
            return cb(err)
          }
        )
      }
    ],
    function (err) {
      if (err) return winston.warn(err)
      // Send to parent
      process.send({ cache: cache })

      cache.flushAll()

      if (_.isFunction(callback)) {
        return callback(err)
      }
    }
  )
}

// Fork of Main
;(function () {
  process.on('message', function (message) {
    if (message.name === 'cache:refresh') {
      winston.debug('Refreshing Cache....')
      const now = moment()
      const timeSinceLast = Math.round(moment.duration(now.diff(lastUpdated)).asMinutes())
      if (timeSinceLast < 5) {
        const i = 5 - timeSinceLast
        winston.debug('Cannot refresh cache for another ' + i + ' minutes')
        return false
      }

      truCache.refreshCache(function () {
        winston.debug('Cache Refreshed at ' + lastUpdated.format('hh:mm:ssa'))
        restartRefreshClock()
      })
    }

    if (message.name === 'cache:refresh:force') {
      winston.debug('Forcing Refreshing Cache....')

      truCache.refreshCache(function () {
        winston.debug('Cache Refreshed at ' + lastUpdated.format('hh:mm:ssa'))
        restartRefreshClock()
      })
    }
  })

  loadConfig()
  const db = require('../database')
  db.init(function (err) {
    if (err) return winston.error(err)
    truCache.init(function (err) {
      if (err) {
        winston.error(err)
        throw new Error(err)
      }

      return process.exit(0)
    })
  })
})()

module.exports = truCache
