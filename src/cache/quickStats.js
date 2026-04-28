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
const ticketSchema = require('../models/ticket')

_.mixin({
  sortKeysBy: function (obj, comparator) {
    const keys = _.sortBy(_.keys(obj), function (key) {
      return comparator ? comparator(obj[key], key) : key
    })

    return _.zipObject(
      keys,
      _.map(keys, function (key) {
        return obj[key]
      })
    )
  }
})

const init = async function (tickets) {
  const obj = {}
  let $tickets = []

  // Replace async.series with Promise.all for parallel execution
  try {
    if (tickets) {
      $tickets = await ticketSchema.populate(tickets, { path: 'owner comments.owner assignee' })
    } else {
      const ticketData = await ticketSchema.getForCache()
      $tickets = await ticketSchema.populate(ticketData, { path: 'owner comments.owner assignee' })
    }

    // Execute all build functions in parallel
    const [mostRequesterResult, mostCommenterResult, mostAssigneeResult, mostActiveTicketResult] = await Promise.all([
      buildMostRequester($tickets),
      buildMostComments($tickets),
      buildMostAssignee($tickets),
      buildMostActiveTicket($tickets)
    ])

    obj.mostRequester = _.first(mostRequesterResult)
    obj.mostCommenter = _.first(mostCommenterResult)
    obj.mostAssignee = _.first(mostAssigneeResult)
    obj.mostActiveTicket = _.first(mostActiveTicketResult)

    $tickets = null // clear it
    return obj
  } catch (err) {
    throw err
  }
}

function buildMostRequester (ticketArray) {
  let requesters = _.map(ticketArray, function (m) {
    if (m.owner) {
      return m.owner.fullname
    }

    return null
  })

  requesters = _.compact(requesters)

  let r = _.countBy(requesters, function (k) {
    return k
  })
  r = _(r).value()

  r = _.map(r, function (v, k) {
    return { name: k, value: v }
  })

  r = _.sortBy(r, function (o) {
    return -o.value
  })

  return r
}

function flatten (arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  }, [])
}

function buildMostComments (ticketArray) {
  let commenters = _.map(ticketArray, function (m) {
    return _.map(m.comments, function (i) {
      return i.owner.fullname
    })
  })

  commenters = flatten(commenters)

  let c = _.countBy(commenters, function (k) {
    return k
  })

  c = _(c).value()

  c = _.map(c, function (v, k) {
    return { name: k, value: v }
  })

  c = _.sortBy(c, function (o) {
    return -o.value
  })

  return c
}

function buildMostAssignee (ticketArray) {
  ticketArray = _.reject(ticketArray, function (v) {
    return _.isUndefined(v.assignee) || _.isNull(v.assignee)
  })

  const assignees = _.map(ticketArray, function (m) {
    return m.assignee.fullname
  })

  let a = _.countBy(assignees, function (k) {
    return k
  })

  a = _(a).value()

  a = _.map(a, function (v, k) {
    return { name: k, value: v }
  })

  a = _.sortBy(a, function (o) {
    return -o.value
  })

  return a
}

function buildMostActiveTicket (ticketArray) {
  let tickets = _.map(ticketArray, function (m) {
    return { uid: m.uid, cSize: _.size(m.history) }
  })

  tickets = _.sortBy(tickets, 'cSize').reverse()

  return tickets
}

module.exports = init
