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

import _ from 'lodash'
import moment from 'moment'
import { TicketModel } from '../models'

const init = (tickets, timespan, callback) => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        let tags = []
        let $tickets = []
        if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = 365

        let today = moment()
          .hour(23)
          .minute(59)
          .second(59)
        const tsDate = today
          .clone()
          .subtract(timespan, 'd')
          .toDate()
          .getTime()
        today = today.toDate().getTime()

        if (tickets) {
          $tickets = await TicketModel.populate(tickets, { path: 'tags' })
        } else {
          let tickets = await TicketModel.getForCache()
          $tickets = await TicketModel.populate(tickets, { path: 'tags' })
        }

        let t = []
        $tickets = _.filter($tickets, v => v.date < today && v.date > tsDate)

        for (const ticket of $tickets) {
          _.each(ticket.tags, tag => {
            t.push(tag.name)
          })
        }

        tags = _.reduce(
          t,
          (counts, key) => {
            counts[key]++
            return counts
          },
          _.fromPairs(_.map(t, key => [key, 0]))
        )

        tags = _.fromPairs(_.sortBy(_.toPairs(tags), a => a[1]).reverse())

        t = null
        $tickets = null

        if (typeof callback === 'function') callback(null, tags)

        return resolve(tags)
      } catch (e) {
        if (typeof callback === 'function') callback(e)
        return reject(e)
      }
    })()
  })
}

module.exports = init
