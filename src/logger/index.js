var Winston = require('winston')

const logger = Winston.createLogger({
    transports: [
      new Winston.transports.Console({
        format: Winston.format.combine(
          Winston.format.colorize(),
          Winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss [" + global.process.pid + "]"
          }),
          Winston.format.align(),
          Winston.format.printf(
            info => `${info.timestamp} ${info.level}: ${info.message}`
          )
        ),
        level: process.env.NODE_ENV != 'production' ? 'debug' : 'info'
      })
    ]
  })

  module.exports = logger