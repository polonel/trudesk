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

const _ = require('lodash')
const async = require('async')
const moment = require('moment')
const winston = require('winston')

const ticketSchema = require('../models/ticket')

const ex = {}

function buildGraphData (arr, days, callback) {
  const graphData = []
  if (arr.length < 1) {
    return callback(graphData)
  }
  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const timespanArray = []
  for (let i = days; i--; ) {
    timespanArray.push(i)
  }

  arr = _.map(arr, function (i) {
    return moment(i.date).format('YYYY-MM-DD')
  })

  let counted = _.countBy(arr)

  for (let k = 0; k < timespanArray.length; k++) {
    const obj = {}
    const day = timespanArray[k]
    const d = today.clone().subtract(day, 'd')
    obj.date = d.format('YYYY-MM-DD')

    obj.value = counted[obj.date] === undefined ? 0 : counted[obj.date]

    graphData.push(obj)
  }

  counted = null

  return callback(graphData)
}

function buildAvgResponse (ticketArray, callback) {
  const cbObj = {}
  const $ticketAvg = []
  for (let i = 0; i < ticketArray.length; i++) {
    const ticket = ticketArray[i]
    if (ticket.comments === undefined || ticket.comments.length < 1) continue

    const ticketDate = moment(ticket.date)
    const firstCommentDate = moment(ticket.comments[0].date)

    const diff = firstCommentDate.diff(ticketDate, 'seconds')
    $ticketAvg.push(diff)
  }

  const ticketAvgTotal = _.reduce(
    $ticketAvg,
    function (m, x) {
      return m + x
    },
    0
  )

  const tvt = moment.duration(Math.round(ticketAvgTotal / _.size($ticketAvg)), 'seconds').asHours()
  cbObj.avgResponse = Math.floor(tvt)

  return callback(cbObj)
}

const init = function (tickets, callback) {
  let $tickets = []
  ex.e30 = {}
  ex.e60 = {}
  ex.e90 = {}
  ex.e180 = {}
  ex.e365 = {}
  ex.lifetime = {}
  ex.lastUpdated = moment.utc()
  const today = moment()
    .hour(23)
    .minute(59)
    .second(59)
  const e30 = today.clone().subtract(30, 'd')
  const e60 = today.clone().subtract(60, 'd')
  const e90 = today.clone().subtract(90, 'd')
  const e180 = today.clone().subtract(180, 'd')
  // e365 = today.clone().subtract(365, 'd');

  async.series(
    [
      function (done) {
        if (tickets) {
          $tickets = _.cloneDeep(tickets)

          return done()
        }

        winston.debug('No Tickets sent to cache (Pulling...)')
        ticketSchema.getForCache(function (err, tickets) {
          if (err) return done(err)

          $tickets = tickets

          return done()
        })
      },
      function (done) {
        async.series(
          {
            e365: function (c) {
              ex.e365.tickets = $tickets

              ex.e365.closedTickets = _.chain(ex.e365.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e365.tickets, 365, function (graphData) {
                ex.e365.graphData = graphData

                // Get average Response
                buildAvgResponse(ex.e365.tickets, function (obj) {
                  ex.e365.avgResponse = obj.avgResponse
                  ex.e365.tickets = _.size(ex.e365.tickets)
                  ex.e365.closedTickets = _.size(ex.e365.closedTickets)

                  // Remove all tickets more than 180 days
                  const t180 = e180.toDate().getTime()
                  $tickets = _.filter($tickets, function (t) {
                    return t.date > t180
                  })

                  return c()
                })
              })
            },
            e180: function (c) {
              ex.e180.tickets = $tickets

              ex.e180.closedTickets = _.chain(ex.e180.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e180.tickets, 180, function (graphData) {
                ex.e180.graphData = graphData

                buildAvgResponse(ex.e180.tickets, function (obj) {
                  ex.e180.avgResponse = obj.avgResponse
                  ex.e180.tickets = _.size(ex.e180.tickets)
                  ex.e180.closedTickets = _.size(ex.e180.closedTickets)

                  // Remove all tickets more than 90 days
                  const t90 = e90.toDate().getTime()
                  $tickets = _.filter($tickets, function (t) {
                    return t.date > t90
                  })

                  return c()
                })
              })
            },
            e90: function (c) {
              ex.e90.tickets = $tickets

              ex.e90.closedTickets = _.chain(ex.e90.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e90.tickets, 90, function (graphData) {
                ex.e90.graphData = graphData

                buildAvgResponse(ex.e90.tickets, function (obj) {
                  ex.e90.avgResponse = obj.avgResponse
                  ex.e90.tickets = _.size(ex.e90.tickets)
                  ex.e90.closedTickets = _.size(ex.e90.closedTickets)

                  // Remove all tickets more than 60 days
                  const t60 = e60.toDate().getTime()
                  $tickets = _.filter($tickets, function (t) {
                    return t.date > t60
                  })

                  return c()
                })
              })
            },
            e60: function (c) {
              ex.e60.tickets = $tickets

              ex.e60.closedTickets = _.chain(ex.e60.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e60.tickets, 60, function (graphData) {
                ex.e60.graphData = graphData

                buildAvgResponse(ex.e60.tickets, function (obj) {
                  ex.e60.avgResponse = obj.avgResponse
                  ex.e60.tickets = _.size(ex.e60.tickets)
                  ex.e60.closedTickets = _.size(ex.e60.closedTickets)

                  // Remove all tickets more than 30 days
                  const t30 = e30.toDate().getTime()
                  $tickets = _.filter($tickets, function (t) {
                    return t.date > t30
                  })

                  return c()
                })
              })
            },
            e30: function (c) {
              ex.e30.tickets = $tickets

              ex.e30.closedTickets = _.chain(ex.e30.tickets)
                .map('status')
                .filter(function (v) {
                  return v === 3
                })
                .value()

              buildGraphData(ex.e30.tickets, 30, function (graphData) {
                ex.e30.graphData = graphData

                buildAvgResponse(ex.e30.tickets, function (obj) {
                  ex.e30.avgResponse = obj.avgResponse
                  ex.e30.tickets = _.size(ex.e30.tickets)
                  ex.e30.closedTickets = _.size(ex.e30.closedTickets)

                  return c()
                })
              })
            }
          },
          function (err) {
            return done(err)
          }
        )
      }
    ],
    function (err) {
      $tickets = null
      return callback(err, ex)
    }
  )
}

module.exports = init
