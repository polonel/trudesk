/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    09/08/2018
 Author:     Chris Brame

 **/

const _ = require('lodash')
const path = require('path')
const nconf = require('nconf')
const winston = require('../logger')
const elasticsearch = require('@elastic/elasticsearch')
const ESErrors = require('@elastic/elasticsearch').errors
const emitter = require('../emitter')
const moment = require('moment-timezone')
const settingUtil = require('../settings/settingsUtil')

const ES = {}
ES.indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'trudesk'

const checkConnection = callback => {
  const errorText = 'Elasticsearch client not initialized. Restart Trudesk!'
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        if (!ES.esclient) {
          if (typeof callback === 'function') callback(errorText)

          return reject(errorText)
        }

        await ES.esclient.ping()

        if (typeof callback === 'function') callback()

        return resolve()
      } catch (e) {
        if (typeof callback === 'function') callback(errorText)

        return reject(errorText)
      }
    })()
  })
}

ES.testConnection = async callback => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        if (process.env.ELASTICSEARCH_URI) ES.host = process.env.ELASTICSEARCH_URI
        else ES.host = nconf.get('elasticsearch:host') + ':' + nconf.get('elasticsearch:port')

        ES.esclient = new elasticsearch.Client({
          node: ES.host
        })

        await checkConnection()

        if (typeof callback === 'function') callback()

        return resolve()
      } catch (e) {
        if (typeof callback === 'function') callback(e)

        return reject(e)
      }
    })()
  })
}

ES.setupHooks = () => {
  const ticketSchema = require('../models/ticket')

  emitter.on('ticket:deleted', async _id => {
    if (_.isUndefined(_id)) return false

    try {
      await ES.esclient.delete({
        index: ES.indexName,
        id: _id.toString(),
        refresh: 'true'
      })
    } catch (e) {
      winston.warn('Elasticsearch Error: ' + e)
    }
  })

  emitter.on('ticket:updated', async data => {
    if (_.isUndefined(data._id)) return

    try {
      const ticket = await ticketSchema.getTicketById(data._id.toString())

      const cleanedTicket = {
        type: 'ticket',
        uid: ticket.uid,
        subject: ticket.subject,
        issue: ticket.issue,
        date: ticket.date,
        owner: ticket.owner,
        assignee: ticket.assignee,
        group: {
          _id: ticket.group._id,
          name: ticket.group.name
        },
        comments: ticket.comments,
        notes: ticket.notes,
        deleted: ticket.deleted,
        priority: {
          _id: ticket.priority._id,
          name: ticket.priority.name,
          htmlColor: ticket.priority.htmlColor
        },
        ticketType: { _id: ticket.type._id, name: ticket.type.name },
        status: ticket.status,
        tags: ticket.tags
      }

      await ES.esclient.index({
        index: ES.indexName,
        id: ticket._id.toString(),
        refresh: 'true',
        body: cleanedTicket
      })
    } catch (e) {
      winston.warn('Elasticsearch Error: ' + e)
      return false
    }
  })

  emitter.on('ticket:created', data => {
    ticketSchema.getTicketById(data.ticket._id, function (err, ticket) {
      if (err) {
        winston.warn('Elasticsearch Error: ' + err)
        return false
      }

      const _id = ticket._id.toString()
      const cleanedTicket = {
        type: 'ticket',
        uid: ticket.uid,
        subject: ticket.subject,
        issue: ticket.issue,
        date: ticket.date,
        dateFormatted: moment
          .utc(ticket.date)
          .tz(ES.timezone)
          .format('MMMM D YYYY'),
        owner: ticket.owner,
        assignee: ticket.assignee,
        group: {
          _id: ticket.group._id,
          name: ticket.group.name
        },
        comments: ticket.comments,
        notes: ticket.notes,
        deleted: ticket.deleted,
        priority: {
          _id: ticket.priority._id,
          name: ticket.priority.name,
          htmlColor: ticket.priority.htmlColor
        },
        typeTicket: { _id: ticket.type._id, name: ticket.type.name },
        status: ticket.status,
        tags: ticket.tags
      }

      ES.esclient.index(
        {
          index: ES.indexName,
          id: _id,
          body: cleanedTicket
        },
        function (err) {
          if (err) winston.warn('Elasticsearch Error: ' + err)
        }
      )
    })
  })
}

ES.buildClient = host => {
  if (ES.esclient) ES.esclient.close()

  ES.esclient = new elasticsearch.Client({
    node: host,
    pingTimeout: 10000,
    maxRetries: 5
  })
}

ES.rebuildIndex = async () => {
  if (global.esRebuilding) {
    winston.warn('Index Rebuild attempted while already rebuilding!')
    return
  }
  try {
    const settings = await settingUtil.getSettings()

    if (!settings.settings.elasticSearchConfigured.value) return false

    const s = settings.settings

    const ELASTICSEARCH_URI = s.elasticSearchHost.value + ':' + s.elasticSearchPort.value

    ES.buildClient(ELASTICSEARCH_URI)

    global.esStatus = 'Rebuilding...'

    const fork = require('child_process').fork
    const esFork = fork(path.join(__dirname, 'rebuildIndexChild.js'), {
      env: {
        FORK: 1,
        NODE_ENV: global.env,
        ELASTICSEARCH_INDEX_NAME: ES.indexName,
        ELASTICSEARCH_URI: ELASTICSEARCH_URI,
        MONGODB_URI: global.CONNECTION_URI
      }
    })

    global.esRebuilding = true
    global.forks.push({ name: 'elasticsearchRebuild', fork: esFork })

    esFork.once('message', function (data) {
      global.esStatus = data.success ? 'Connected' : 'Error'
      global.esRebuilding = false
    })

    esFork.on('exit', function () {
      winston.debug('Rebuilding Process Closed: ' + esFork.pid)
      global.esRebuilding = false
      global.forks = _.filter(global.forks, function (i) {
        return i.name !== 'elasticsearchRebuild'
      })
    })
  } catch (e) {
    winston.error(e)
    return false
  }
}

ES.getIndexCount = async callback => {
  return new Promise((resolve, reject) => {
    if (_.isUndefined(ES.esclient)) {
      const error = 'Elasticsearch has not initialized'

      if (typeof callback === 'function') callback(error)

      return reject(error)
    }

    const count = ES.esclient.count({ index: ES.indexName })
    if (typeof callback === 'function') callback(null, count)

    return resolve(count)
  })
}

ES.init = async callback => {
  try {
    global.esStatus = 'Not Configured'
    global.esRebuilding = false

    const s = await settingUtil.getSettings()
    const settings = s.settings
    const ENABLED = settings.elasticSearchConfigured.value

    if (!ENABLED) {
      if (typeof callback === 'function') return callback()

      return false
    }

    winston.debug('Initializing Elasticsearch...')
    global.esStatus = 'Initializing'
    ES.timezone = settings.timezone.value

    ES.setupHooks()

    if (process.env.ELATICSEARCH_URI) ES.host = process.env.ELATICSEARCH_URI
    else ES.host = settings.elasticSearchHost.value + ':' + settings.elasticSearchPort.value

    ES.buildClient(ES.host)

    await checkConnection()

    winston.info('Elasticsearch Running... Connected.')
    global.esStatus = 'Connected'

    if (typeof callback === 'function') callback()
  } catch (e) {
    global.esStatus = 'Error'
    if (typeof callback === 'function') callback(e)
  }
}

ES.checkConnection = async callback => {
  try {
    await checkConnection()

    global.esStatus = 'Connected'

    if (typeof callback === 'function') return callback()
  } catch (e) {
    global.esStatus = 'Error'
    winston.warn(e)
    if (typeof callback === 'function') return callback()
  }
}

module.exports = ES
