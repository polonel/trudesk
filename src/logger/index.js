const Winston = require('winston')

const webhookFailureLog = new Map()

const logger = Winston.createLogger({
  format: Winston.format.errors({ stack: true }),
  transports: [
    new Winston.transports.Console({
      format: Winston.format.combine(
        Winston.format.errors({ stack: true }),
        Winston.format.colorize(),
        Winston.format.splat(),
        Winston.format.timestamp({
          format: 'MM-DD-YYYY HH:mm:ss [[' + global.process.pid + ']]'
        }),
        Winston.format.align(),
        Winston.format.printf(info => {
          if (info.stack) {
            return `${info.timestamp} ${info.level}: ${info.message} - ${info.stack}`
          }

          return `${info.timestamp} ${info.level}: ${info.message}`
        })
      ),
      level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info'
    })
  ]
})

logger.recordWebhookFailure = function (webhook, result) {
  const key = webhook._id ? webhook._id.toString() : webhook
  const entry = {
    timestamp: result.timestamp || new Date(),
    message: result.errorMessage || result.message,
    attempt: result.attempt,
    responseCode: result.responseCode,
    name: webhook.name
  }

  const entries = webhookFailureLog.get(key) || []
  entries.push(entry)
  if (entries.length > 20) entries.shift()
  webhookFailureLog.set(key, entries)
}

logger.getWebhookFailures = function (webhookId) {
  return webhookFailureLog.get(webhookId.toString()) || []
}

module.exports = logger
