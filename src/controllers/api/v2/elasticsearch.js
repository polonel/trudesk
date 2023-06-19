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
 *  Updated:    4/14/19 2:32 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import _ from 'lodash'
import logger from '../../../logger'
import es from '../../../elasticsearch'
import ticketSchema from '../../../models/ticket'
import { DepartmentModel, GroupModel } from '../../../models'
import apiUtils from '../apiUtils'

const apiElasticSearch = {}

apiElasticSearch.rebuild = (req, res) => {
  es.rebuildIndex()

  return apiUtils.sendApiSuccess(res)
}

apiElasticSearch.status = async (req, res) => {
  const response = {}

  try {
    const getIndexCountData = () =>
      new Promise((resolve, reject) => {
        ;(async () => {
          try {
            const data = await es.getIndexCount()
            const indexCount = !_.isUndefined(data.count) ? data.count : 0

            resolve(indexCount)
          } catch (e) {
            reject(e)
          }
        })()
      })

    const getDBCount = () =>
      new Promise((resolve, reject) => {
        ;(async () => {
          try {
            const ticketCount = await ticketSchema.getCount()
            resolve(ticketCount)
          } catch (e) {
            reject(e)
          }
        })()
      })

    const [__, indexCount, ticketCount] = await Promise.all([es.checkConnection(), getIndexCountData(), getDBCount()])
    response.indexCount = indexCount
    response.dbCount = ticketCount
    response.esStatus = global.esStatus
    response.isRebuilding = global.esRebuilding === true
    response.inSync = response.dbCount === response.indexCount

    return apiUtils.sendApiSuccess(res, { status: response })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') logger.warn(e.message)

    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiElasticSearch.search = async (req, res) => {
  var limit = !_.isUndefined(req.query['limit']) ? req.query.limit : 100
  try {
    limit = parseInt(limit)
  } catch (e) {
    limit = 100
  }

  try {
    let groups = []
    if (!req.user.role.isAdmin && !req.user.role.isAgent) {
      groups = await GroupModel.getAllGroupsOfUser(req.user._id)
    } else {
      groups = await DepartmentModel.getDepartmentGroupsOfUser(req.user._id)
    }

    const g = _.map(groups, i => i._id)

    const obj = {
      index: es.indexName,
      body: {
        size: limit,
        from: 0,
        query: {
          bool: {
            must: {
              multi_match: {
                query: req.query['q'],
                type: 'cross_fields',
                operator: 'and',
                fields: [
                  'uid^5',
                  'subject^4',
                  'issue^4',
                  'owner.fullname',
                  'owner.username',
                  'owner.email',
                  'comments.owner.email',
                  'tags.normalized',
                  'priority.name',
                  'type.name',
                  'group.name',
                  'comments.comment^3',
                  'notes.note^3',
                  'dateFormatted'
                ],
                tie_breaker: 0.3
              }
            },
            filter: {
              terms: { 'group._id': g }
            }
          }
        }
      }
    }

    if (!es || !es.esclient) return apiUtils.sendApiError(res, 400, 'Elasticsearch is not configured')

    es.esclient.search(obj).then(r => {
      return res.send(r)
    })
  } catch (e) {
    logger.debug(e)
    return apiUtils.sendApiError(res, 500, { error: e })
  }
}

module.exports = apiElasticSearch
