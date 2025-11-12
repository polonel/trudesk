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
const { URL } = require('url')
const WebhookSchema = require('../../../models/webhook')
const logger = require('../../../logger')
const webhookDispatcher = require('../../../helpers/webhookDispatcher')

const SUPPORTED_EVENTS = webhookDispatcher.supportedEvents

function serializeWebhook (webhook) {
  const hook = webhook.toObject({ getters: true })
  hook.hasSecret = Boolean(hook.secret)
  delete hook.secret
  hook.logs = hook.logs || []
  hook.failureLog = logger.getWebhookFailures(webhook._id || hook._id)
  return hook
}

function validatePayload (payload) {
  const name = _.get(payload, 'name', '').trim()
  const url = _.get(payload, 'url', '').trim()
  const events = _.get(payload, 'events', [])
  const enabled = _.get(payload, 'enabled', true)

  if (!name) return { valid: false, error: 'Name is required.' }
  if (!url) return { valid: false, error: 'URL is required.' }

  try {
    // eslint-disable-next-line no-new
    new URL(url)
  } catch (e) {
    return { valid: false, error: 'URL is invalid.' }
  }

  if (!Array.isArray(events) || events.length === 0) {
    return { valid: false, error: 'At least one event must be selected.' }
  }

  const invalidEvents = events.filter(event => !SUPPORTED_EVENTS.includes(event))
  if (invalidEvents.length > 0) {
    return { valid: false, error: 'Unsupported events: ' + invalidEvents.join(', ') }
  }

  const secretRaw = _.get(payload, 'secret', undefined)

  return {
    valid: true,
    data: {
      name,
      url,
      events: _.uniq(events),
      secret: secretRaw ? secretRaw.trim() : undefined,
      enabled: Boolean(enabled)
    }
  }
}

const apiWebhooks = {}

apiWebhooks.list = async function (req, res) {
  try {
    const webhooks = await WebhookSchema.find({}).sort({ createdAt: 1 }).exec()
    const serialized = webhooks.map(serializeWebhook)
    return res.json({ success: true, webhooks: serialized, supportedEvents: SUPPORTED_EVENTS })
  } catch (error) {
    logger.error('Failed to list webhooks: %s', error.message)
    return res.status(500).json({ success: false, error: 'Unable to list webhooks.' })
  }
}

apiWebhooks.create = async function (req, res) {
  const validation = validatePayload(req.body || {})
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error })
  }

  try {
    const payload = validation.data
    const webhook = new WebhookSchema(payload)
    const saved = await webhook.save()
    return res.status(201).json({ success: true, webhook: serializeWebhook(saved) })
  } catch (error) {
    logger.error('Failed to create webhook: %s', error.message)
    return res.status(400).json({ success: false, error: error.message })
  }
}

apiWebhooks.update = async function (req, res) {
  const id = req.params.id
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook id.' })

  const validation = validatePayload(req.body || {})
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error })
  }

  try {
    const payload = validation.data
    const webhook = await WebhookSchema.findById(id)
    if (!webhook) return res.status(404).json({ success: false, error: 'Webhook not found.' })

    webhook.name = payload.name
    webhook.url = payload.url
    webhook.events = payload.events
    webhook.enabled = payload.enabled

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'secret')) {
      if (payload.secret) webhook.secret = payload.secret
      else webhook.secret = undefined
    }

    const saved = await webhook.save()
    return res.json({ success: true, webhook: serializeWebhook(saved) })
  } catch (error) {
    logger.error('Failed to update webhook %s: %s', id, error.message)
    return res.status(400).json({ success: false, error: error.message })
  }
}

apiWebhooks.remove = async function (req, res) {
  const id = req.params.id
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook id.' })

  try {
    const removed = await WebhookSchema.findByIdAndDelete(id)
    if (!removed) return res.status(404).json({ success: false, error: 'Webhook not found.' })
    return res.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete webhook %s: %s', id, error.message)
    return res.status(400).json({ success: false, error: error.message })
  }
}

apiWebhooks.toggle = async function (req, res) {
  const id = req.params.id
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook id.' })

  if (!Object.prototype.hasOwnProperty.call(req.body || {}, 'enabled')) {
    return res.status(400).json({ success: false, error: 'Missing enabled flag.' })
  }

  const enabled = Boolean(_.get(req.body, 'enabled'))

  try {
    const webhook = await WebhookSchema.findById(id)
    if (!webhook) return res.status(404).json({ success: false, error: 'Webhook not found.' })

    webhook.enabled = enabled
    if (!enabled) {
      webhook.lastStatus = 'disabled'
    } else if (webhook.lastStatus === 'disabled') {
      webhook.lastStatus = 'idle'
    }
    const saved = await webhook.save()

    return res.json({ success: true, webhook: serializeWebhook(saved) })
  } catch (error) {
    logger.error('Failed to toggle webhook %s: %s', id, error.message)
    return res.status(400).json({ success: false, error: error.message })
  }
}

apiWebhooks.test = async function (req, res) {
  const id = req.params.id
  if (!id) return res.status(400).json({ success: false, error: 'Missing webhook id.' })

  try {
    const webhook = await WebhookSchema.findById(id)
    if (!webhook) return res.status(404).json({ success: false, error: 'Webhook not found.' })

    const payload = {
      trigger: 'manual:test',
      user: _.get(req, 'user._id', null),
      timestamp: new Date().toISOString()
    }

    await webhookDispatcher.dispatchToWebhook(webhook, 'webhook:test', payload, { force: true })

    const refreshed = await WebhookSchema.findById(id)
    return res.json({ success: true, webhook: serializeWebhook(refreshed) })
  } catch (error) {
    logger.error('Failed to test webhook %s: %s', id, error.message)
    return res.status(500).json({ success: false, error: 'Unable to test webhook.' })
  }
}

module.exports = apiWebhooks
