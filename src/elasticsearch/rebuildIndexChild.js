import elasticsearch from '@elastic/elasticsearch'
import winston from '../logger'
import moment from 'moment-timezone'
import { init as dbInit } from '../database'
import settingSchema from '../models/setting'
import { UserModel, TicketModel } from '../models'

global.env = process.env.NODE_ENV || 'production'

const ES = {
  indexName: process.env.ELASTICSEARCH_INDEX_NAME || 'trudesk',
  esclient: null,
  mongodb: null,
  timezone: 'UTC'
}

const INDEX_BODY = {
  settings: {
    index: { number_of_replicas: 0 },
    analysis: {
      filter: {
        leadahead: { type: 'edge_ngram', min_gram: 1, max_gram: 20 },
        email: {
          type: 'pattern_capture',
          preserve_original: true,
          patterns: ['([^@]+)', '(\\p{L}+)', '(\\d+)', '@(.+)']
        } 
      },
      analyzer: {
        leadahead: { type: 'custom', tokenizer: 'standard', filter: ['lowercase', 'leadahead'] },
        email: { tokenizer: 'uax_url_email', filter: ['email', 'lowercase', 'unique'] }
      }
    }
  },
  mappings: {
    properties: {
      type: { type: 'keyword' },
      uid: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
      subject: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
      issue: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
      dateFormatted: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
      comments: {
        properties: {
          comment: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
          owner: { properties: { email: { type: 'text', analyzer: 'email' } } }
        }
      },
      notes: {
        properties: {
          note: { type: 'text', analyzer: 'leadahead', search_analyzer: 'standard' },
          owner: { properties: { email: { type: 'text', analyzer: 'email' } } }
        }
      },
      owner: { properties: { email: { type: 'text', analyzer: 'email' } } }
    }
  }  
}

function setupDatabase () {
  return new Promise((resolve, reject) => {
    dbInit((err, db) => {
      if (err) return reject(err)
      ES.mongodb = db
      resolve(db)
    }, process.env.MONGODB_URI)
  })
}

async function setupTimezone () {
  const setting = await settingSchema.getSettingByName('gen:timezone')
  ES.timezone = (setting && setting.value) ? setting.value : 'UTC'
}

function setupClient () {
  ES.esclient = new elasticsearch.Client({
    node: process.env.ELASTICSEARCH_URI,
    pingTimeout: 10000,
    requestTimeout: 10000,
    maxRetries: 5,
    serverMode: 'es8'
  })
}

async function deleteIndex () {
  const exists = await ES.esclient.indices.exists({ index: ES.indexName })
  if (exists) {
    await ES.esclient.indices.delete({ index: ES.indexName })
  }
}

async function createIndex () {
  await ES.esclient.indices.create({ index: ES.indexName, body: INDEX_BODY })
}

async function flushBulk (bulk) {
  if (bulk.length === 0) return []
  await ES.esclient.bulk({ body: bulk, timeout: '3m' })
  winston.debug(`Sent ${bulk.length/2} documents to Elasticsearch!`)
  return []
}

function buildPersonShape (doc) {
  return {
    _id: doc._id,
    fullname: doc.fullname,
    username: doc.username,
    email: doc.email,
    role: doc.role,
    title: doc.title
  }
}

function crawlUsers () {
  let count = 0
  const startTime = Date.now()
  const stream = UserModel.find({ deleted: false }).lean().cursor()
  let bulk = []

  return new Promise((resolve, reject) => {
    stream
      .on('data', async (doc) => {
        stream.pause()
        count += 1
        bulk.push({ index: { _index: ES.indexName, _id: doc._id } })
        bulk.push({
          datatype: 'user',
          username: doc.username,
          email: doc.email,
          fullname: doc.fullname,
          title: doc.title,
          role: doc.role
        })
        if (count % 200 === 0) bulk = await flushBulk(bulk)
        stream.resume()
      })
      .on('error', reject)
      .on('close', async () => {
        await flushBulk(bulk)
        winston.debug(`Document Count: ${count}`)
        winston.debug(`Duration: ${Date.now() - startTime}ms`)
        resolve()
      })
  })
}

function crawlTickets () {
  let count = 0
  const startTime = Date.now()
  const stream = TicketModel.find({ deleted: false })
    .populate('owner group comments.owner notes.owner tags priority type status')
    .lean()
    .cursor()
  let bulk = []

  return new Promise((resolve, reject) => {
    stream
      .on('data', async (doc) => {
        stream.pause()
        count += 1

        bulk.push({ index: { _index: ES.indexName, _id: doc._id } })
        bulk.push({
          type: 'ticket',
          uid: doc.uid,
          owner: buildPersonShape(doc.owner),
          group: { _id: doc.group._id, name: doc.group.name },
          issue: doc.issue,
          subject: doc.subject,
          date: doc.date,
          dateFormatted: moment.utc(doc.date).tz(ES.timezone).format('MMMM D YYYY'),
          priority: { _id: doc.priority._id, name: doc.priority.name, htmlColor: doc.priority.htmlColor },
          ticketType: { _id: doc.type._id, name: doc.type.name },
          status: { _id: doc.status._id, name: doc.status.name, htmlColor: doc.status.htmlColor, uid: doc.status.uid },
          deleted: doc.deleted,
          comments: (doc.comments || []).map(c => ({
            comment: c.comment,
            _id: c._id,
            deleted: c.deleted,
            date: c.date,
            owner: buildPersonShape(c.owner)
          })),
          notes: doc.notes,
          tags: doc.tags
        })

        if (count % 200 === 0) bulk = await flushBulk(bulk)
        stream.resume()
      })
      .on('error', reject)
      .on('close', async () => {
        await flushBulk(bulk)
        winston.debug(`Document Count: ${count}`)
        winston.debug(`Duration: ${Date.now() - startTime}ms`)
        resolve()
      })
  })
}

async function rebuild () {
  await setupDatabase()
  await setupTimezone()
  await deleteIndex()
  await createIndex()
  // await crawlUsers()
  await crawlTickets()
}

;(async function () {
  winston.info('Starting Elasticsearch index rebuild...')
  setupClient()
  try {
    await rebuild()
    winston.info('Elasticsearch rebuild completed successfully.')
    setTimeout(() => {
      process.send({ success: true })
      process.exit(0)
    }, 6000)
  } catch (err) {
    winston.error(err)
    process.send({ success: false, error: err })
    process.exit(0)
  }
})()
