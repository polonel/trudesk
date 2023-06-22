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

const _ = require('lodash')
const async = require('async')
const winston = require('../../../logger')
const es = require('../../../elasticsearch')
const ticketSchema = require('../../../models/ticket')
const groupSchema = require('../../../models/group')

const apiElasticSearch = {}
const apiUtil = require('../apiUtils')

apiElasticSearch.rebuild = (req, res) => {
  es.rebuildIndex()

  return apiUtil.sendApiSuccess(res)
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

    return apiUtil.sendApiSuccess(res, { status: response })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') winston.warn(e.message)

    return apiUtil.sendApiError(res, 500, e.message)
  }
}

apiElasticSearch.search = function (req, res) {
  var limit = !_.isUndefined(req.query['limit']) ? req.query.limit : 100
  try {
    limit = parseInt(limit)
  } catch (e) {
    limit = 100
  }

  async.waterfall(
    [
      function (next) {
        if (!req.user.role.isAdmin && !req.user.role.isAgent)
          return groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, next)

        var Department = require('../../../models/department')
        return Department.getDepartmentGroupsOfUser(req.user._id, next)
      },
      function (groups, next) {
        var g = _.map(groups, function (i) {
          return i._id
        })
        // For docker we need to add a unique ID for the index.
        var obj = {
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

        return next(null, obj)
      }
    ],
    function (err, obj) {
      if (err) return apiUtil.sendApiError(res, 500, err.message)
      if (!es || !es.esclient) return apiUtil.sendApiError(res, 400, 'Elasticsearch is not configured')

      es.esclient.search(obj).then(function (r) {
        return res.send(r)
      })
    }
  )
}

module.exports = apiElasticSearch
