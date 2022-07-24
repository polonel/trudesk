import Winston from 'winston'

const logger = Winston.createLogger({
  format: Winston.format.errors({ stack: true }),
  transports: [
    new Winston.transports.Console({
      format: Winston.format.combine(
        Winston.format.errors({ stack: true }),
        Winston.format.colorize(),
        Winston.format.splat(),
        Winston.format.timestamp({
          format: 'MM-DD-YY HH:mm:ss [[' + global.process.pid + ']]'
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

module.exports = logger
export default logger
