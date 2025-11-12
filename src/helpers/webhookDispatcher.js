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

const axios = require('axios')
const crypto = require('crypto')
const _ = require('lodash')

const WebhookSchema = require('../models/webhook')
const logger = require('../logger')

const MAX_ATTEMPTS = 3
const BASE_DELAY = 500
const REQUEST_TIMEOUT = 10000

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildHeaders (webhook, body) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Trudesk-Event': body.event
  }

  if (webhook.secret) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(body))
      .digest('hex')
    headers['X-Trudesk-Signature'] = `sha256=${signature}`
  }

  return headers
}

async function recordResult (webhook, result) {
  const update = {
    $set: {
      lastTriggeredAt: result.timestamp,
      lastResponseCode: result.responseCode,
      lastStatus: result.success ? 'success' : 'failed',
      failureCount: result.success ? 0 : (webhook.failureCount || 0) + 1,
      lastSuccessAt: result.success ? result.timestamp : webhook.lastSuccessAt,
      lastFailureAt: result.success ? webhook.lastFailureAt : result.timestamp
    }
  }

  if (result.success) update.$unset = { lastError: '' }
  else update.$set.lastError = result.errorMessage

  await WebhookSchema.findByIdAndUpdate(webhook._id, update).exec()

  await WebhookSchema.recordLog(webhook._id, {
    status: result.success ? 'success' : 'failed',
    responseCode: result.responseCode,
    message: result.errorMessage,
    attempt: result.attempt,
    timestamp: result.timestamp
  })

  if (!result.success) {
    logger.recordWebhookFailure(webhook, result)
  }
}

async function attemptDelivery (webhook, event, payload) {
  const timestamp = new Date()
  const body = {
    event,
    payload,
    timestamp: timestamp.toISOString()
  }

  const headers = buildHeaders(webhook, body)

  let attempt = 0
  let lastError
  let responseCode

  while (attempt < MAX_ATTEMPTS) {
    attempt += 1
    try {
      const response = await axios.post(webhook.url, body, {
        timeout: REQUEST_TIMEOUT,
        headers
      })
      responseCode = response.status
      if (response.status >= 200 && response.status < 300) {
        await recordResult(webhook, {
          success: true,
          responseCode,
          attempt,
          timestamp
        })
        return
      }

      lastError = new Error(`Unexpected status code: ${response.status}`)
      responseCode = response.status
      throw lastError
    } catch (err) {
      lastError = err
      responseCode = _.get(err, 'response.status', responseCode)
      logger.error('Webhook "%s" attempt %d failed: %s', webhook.name, attempt, err.message)

      if (attempt < MAX_ATTEMPTS) {
        await delay(Math.pow(2, attempt - 1) * BASE_DELAY)
      }
    }
  }

  await recordResult(webhook, {
    success: false,
    responseCode,
    attempt: MAX_ATTEMPTS,
    errorMessage: lastError ? lastError.message : 'Unknown error',
    timestamp: new Date()
  })
}

async function dispatchToWebhook (webhook, event, payload, options = {}) {
  const force = _.get(options, 'force', false)
  if (!force && !webhook.enabled) return

  return attemptDelivery(webhook, event, payload)
}

async function dispatch (event, payload) {
  const webhooks = await WebhookSchema.find({ enabled: true, events: event }).exec()
  if (!webhooks || webhooks.length === 0) return

  await Promise.allSettled(webhooks.map(webhook => dispatchToWebhook(webhook, event, payload)))
}

module.exports = {
  dispatch,
  dispatchToWebhook,
  supportedEvents: ['ticket:created', 'ticket:updated', 'ticket:comment:added', 'ticket:note:added', 'ticket:deleted']
}
