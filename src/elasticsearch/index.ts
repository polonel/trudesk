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

import _ from 'lodash'
import path from 'path'
import nconf from 'nconf'
import winston from '../logger'
import elasticsearch from '@elastic/elasticsearch'
import emitter from '../emitter'
import moment from 'moment-timezone'
import settingUtil from '../settings/settingsUtil'
import { TicketModel as ticketSchema } from '../models'

interface ElasticsearchInterface {
  indexName: string
  esclient?: elasticsearch.Client
  host?: string
  timezone?: string
  testConnection: (callback?: (error?: any) => void) => Promise<void>
  setupHooks: () => void
  buildClient: (host: string) => void
  rebuildIndex: () => Promise<boolean | undefined>
  getIndexCount: (callback?: (error: any, count?: any) => void) => Promise<any>
  init: (callback?: (error?: any) => void) => Promise<void>
  checkConnection: (callback?: () => void) => Promise<void>
}

const ES: ElasticsearchInterface = {} as ElasticsearchInterface
ES.indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'trudesk'

const checkConnection = (callback?: (error?: string) => void): Promise<void> => {
  const errorText = 'Elasticsearch client not initialized. Restart Trudesk!'
  return new Promise((resolve, reject) => {
    (async () => {
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

ES.testConnection = async (callback?: (error?: any) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    (async () => {
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

ES.setupHooks = (): void => {
  emitter.on('ticket:deleted', async (_id: any) => {
    if (_.isUndefined(_id)) return false

    try {
      await ES.esclient!.delete({
        index: ES.indexName,
        id: _id.toString(),
        refresh: 'true'
      })
    } catch (e) {
      winston.warn('Elasticsearch Error: ' + e)
    }
  })

  emitter.on('ticket:updated', async (data: any) => {
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
        status: {
          _id: ticket.status._id,
          name: ticket.status.name,
          htmlColor: ticket.status.htmlColor,
          uid: ticket.status.uid
        },
        tags: ticket.tags
      }

      await ES.esclient!.index({
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

  emitter.on('ticket:created', (data: any) => {
    ticketSchema.getTicketById(data.ticket._id, function (err: any, ticket: any) {
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
        status: {
          _id: ticket.status._id,
          name: ticket.status.name,
          htmlColor: ticket.status.htmlColor,
          uid: ticket.status.uid
        },
        tags: ticket.tags
      }

      ES.esclient!.index(
        {
          index: ES.indexName,
          id: _id,
          body: cleanedTicket
        },
        function (err: any) {
          if (err) winston.warn('Elasticsearch Error: ' + err)
        }
      )
    })
  })
}

ES.buildClient = (host: string): void => {
  if (ES.esclient) ES.esclient.close()

  ES.esclient = new elasticsearch.Client({
    node: host,
    pingTimeout: 10000,
    maxRetries: 5
  })
}

ES.rebuildIndex = async (): Promise<boolean | undefined> => {
  if ((global as any).esRebuilding) {
    winston.warn('Index Rebuild attempted while already rebuilding!')
    return
  }
  try {
    const settings = await settingUtil.getSettings()

    if (!settings.settings.elasticSearchConfigured.value) return false

    const s = settings.settings

    const ELASTICSEARCH_URI = s.elasticSearchHost.value + ':' + s.elasticSearchPort.value

    ES.buildClient(ELASTICSEARCH_URI)

    ;(global as any).esStatus = 'Rebuilding...'

    const fork = require('child_process').fork
    const esFork = fork(path.join(__dirname, 'rebuildIndexChild.js'), {
      env: {
        FORK: 1,
        NODE_ENV: (global as any).env,
        ELASTICSEARCH_INDEX_NAME: ES.indexName,
        ELASTICSEARCH_URI: ELASTICSEARCH_URI,
        MONGODB_URI: (global as any).CONNECTION_URI
      }
    })

    ;(global as any).esRebuilding = true
    ;(global as any).forks.push({ name: 'elasticsearchRebuild', fork: esFork })

    esFork.once('message', function (data: any) {
      ;(global as any).esStatus = data.success ? 'Connected' : 'Error'
      ;(global as any).esRebuilding = false
    })

    esFork.on('exit', function () {
      winston.debug('Rebuilding Process Closed: ' + esFork.pid)
      ;(global as any).esRebuilding = false
      ;(global as any).forks = _.filter((global as any).forks, function (i: any) {
        return i.name !== 'elasticsearchRebuild'
      })
    })
  } catch (e) {
    winston.error(e)
    return false
  }
}

ES.getIndexCount = async (callback?: (error: any, count?: any) => void): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (_.isUndefined(ES.esclient)) {
      const error = 'Elasticsearch has not initialized'

      if (typeof callback === 'function') callback(error)

      return reject(error)
    }

    const count = ES.esclient!.count({ index: ES.indexName })
    if (typeof callback === 'function') callback(null, count)

    return resolve(count)
  })
}

ES.init = async (callback?: (error?: any) => void): Promise<void> => {
  try {
    ;(global as any).esStatus = 'Not Configured'
    ;(global as any).esRebuilding = false

    const s = await settingUtil.getSettings()
    const settings = s.settings
    const ENABLED = settings.elasticSearchConfigured.value

    if (!ENABLED) {
      if (typeof callback === 'function') return callback()

      return
    }

    winston.debug('Initializing Elasticsearch...')
    ;(global as any).esStatus = 'Initializing'
    ES.timezone = settings.timezone.value

    ES.setupHooks()

    if (process.env.ELATICSEARCH_URI) ES.host = process.env.ELATICSEARCH_URI
    else ES.host = settings.elasticSearchHost.value + ':' + settings.elasticSearchPort.value

    ES.buildClient(ES.host)

    await checkConnection()

    winston.info('Elasticsearch Running... Connected.')
    ;(global as any).esStatus = 'Connected'

    if (typeof callback === 'function') callback()
  } catch (e) {
    ;(global as any).esStatus = 'Error'
    if (typeof callback === 'function') callback(e)
  }
}

ES.checkConnection = async (callback?: () => void): Promise<void> => {
  try {
    await checkConnection()

    ;(global as any).esStatus = 'Connected'

    if (typeof callback === 'function') return callback()
  } catch (e) {
    ;(global as any).esStatus = 'Error'
    winston.warn(e)
    if (typeof callback === 'function') return callback()
  }
}

export default ES
