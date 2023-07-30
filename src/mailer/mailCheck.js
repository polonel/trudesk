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
const async = require('async')
const Imap = require('imap')
const winston = require('../logger')
const simpleParser = require('mailparser').simpleParser
const cheerio = require('cheerio')

const emitter = require('../emitter')
const userSchema = require('../models/user')
const groupSchema = require('../models/group')
const ticketTypeSchema = require('../models/tickettype')
const statusSchema = require('../models').Status
const Ticket = require('../models/ticket')

const mailCheck = {}
mailCheck.inbox = []

mailCheck.init = function (settings) {
  var s = {}
  s.mailerCheckEnabled = _.find(settings, function (x) {
    return x.name === 'mailer:check:enable'
  })
  s.mailerCheckHost = _.find(settings, function (x) {
    return x.name === 'mailer:check:host'
  })
  s.mailerCheckPort = _.find(settings, function (x) {
    return x.name === 'mailer:check:port'
  })
  s.mailerCheckUsername = _.find(settings, function (x) {
    return x.name === 'mailer:check:username'
  })
  s.mailerCheckPassword = _.find(settings, function (x) {
    return x.name === 'mailer:check:password'
  })
  s.mailerCheckSelfSign = _.find(settings, function (x) {
    return x.name === 'mailer:check:selfsign'
  })
  s.mailerCheckPolling = _.find(settings, function (x) {
    return x.name === 'mailer:check:polling'
  })
  s.mailerCheckTicketType = _.find(settings, function (x) {
    return x.name === 'mailer:check:ticketype'
  })
  s.mailerCheckTicketPriority = _.find(settings, function (x) {
    return x.name === 'mailer:check:ticketpriority'
  })
  s.mailerCheckCreateAccount = _.find(settings, function (x) {
    return x.name === 'mailer:check:createaccount'
  })
  s.mailerCheckDeleteMessage = _.find(settings, function (x) {
    return x.name === 'mailer:check:deletemessage'
  })

  s.mailerCheckEnabled = s.mailerCheckEnabled === undefined ? { value: false } : s.mailerCheckEnabled
  s.mailerCheckHost = s.mailerCheckHost === undefined ? { value: '' } : s.mailerCheckHost
  s.mailerCheckPort = s.mailerCheckPort === undefined ? { value: 143 } : s.mailerCheckPort
  s.mailerCheckUsername = s.mailerCheckUsername === undefined ? { value: '' } : s.mailerCheckUsername
  s.mailerCheckPassword = s.mailerCheckPassword === undefined ? { value: '' } : s.mailerCheckPassword
  s.mailerCheckSelfSign = s.mailerCheckSelfSign === undefined ? { value: false } : s.mailerCheckSelfSign
  s.mailerCheckPolling = s.mailerCheckPolling === undefined ? { value: 600000 } : s.mailerCheckPolling // 10 min
  s.mailerCheckTicketType = s.mailerCheckTicketType === undefined ? { value: 'Issue' } : s.mailerCheckTicketType
  s.mailerCheckTicketPriority = s.mailerCheckTicketPriority === undefined ? { value: '' } : s.mailerCheckTicketPriority
  s.mailerCheckCreateAccount = s.mailerCheckCreateAccount === undefined ? { value: false } : s.mailerCheckCreateAccount
  s.mailerCheckDeleteMessage = s.mailerCheckDeleteMessage === undefined ? { value: false } : s.mailerCheckDeleteMessage

  const MAILERCHECK_ENABLED = s.mailerCheckEnabled.value
  const MAILERCHECK_HOST = s.mailerCheckHost.value
  const MAILERCHECK_USER = s.mailerCheckUsername.value
  const MAILERCHECK_PASS = s.mailerCheckPassword.value
  const MAILERCHECK_PORT = s.mailerCheckPort.value
  const MAILERCHECK_TLS = s.mailerCheckPort.value === '993'
  const MAILERCHECK_SELFSIGN = s.mailerCheckSelfSign.value
  const POLLING_INTERVAL = s.mailerCheckPolling.value

  if (!MAILERCHECK_ENABLED) return true

  let tlsOptions = {}
  if (MAILERCHECK_SELFSIGN) tlsOptions = { rejectUnauthorized: false }

  mailCheck.Imap = new Imap({
    user: MAILERCHECK_USER,
    password: MAILERCHECK_PASS,
    host: MAILERCHECK_HOST,
    port: MAILERCHECK_PORT,
    tls: MAILERCHECK_TLS,
    tlsOptions: tlsOptions
  })

  mailCheck.fetchMailOptions = {
    defaultTicketType: s.mailerCheckTicketType.value,
    defaultPriority: s.mailerCheckTicketPriority.value,
    createAccount: s.mailerCheckCreateAccount.value,
    deleteMessage: s.mailerCheckDeleteMessage.value
  }

  mailCheck.messages = []

  bindImapError()
  bindImapReady()

  mailCheck.fetchMail()
  mailCheck.checkTimer = setInterval(function () {
    mailCheck.fetchMail()
  }, POLLING_INTERVAL)
}

mailCheck.refetch = function () {
  if (_.isUndefined(mailCheck.fetchMailOptions)) {
    winston.warn('Mailcheck.refetch() running before Mailcheck.init(); please run Mailcheck.init() prior')
    return
  }

  mailCheck.fetchMail()
}

function bindImapError () {
  mailCheck.Imap.on('error', function (err) {
    winston.error(err)
  })
}

function bindImapReady () {
  try {
    mailCheck.Imap.on('ready', function () {
      openInbox(function (err) {
        if (err) {
          mailCheck.Imap.end()
          winston.debug(err)
        } else {
          async.waterfall(
            [
              function (next) {
                mailCheck.Imap.search(['UNSEEN'], next)
              },
              function (results, next) {
                if (_.size(results) < 1) {
                  winston.debug('MailCheck: Nothing to Fetch.')
                  return next()
                }

                winston.debug('Processing %s Mail', _.size(results))

                var flag = '\\Seen'
                if (mailCheck.fetchMailOptions.deleteMessage) {
                  flag = '\\Deleted'
                }

                var f = mailCheck.Imap.fetch(results, {
                  bodies: ''
                })

                f.on('message', function (msg) {
                  msg.on('body', function (stream) {
                    var message = {}
                    var buffer = ''
                    stream.on('data', function (chunk) {
                      buffer += chunk.toString('utf8')
                    })

                    stream.once('end', function () {
                      simpleParser(buffer, function (err, mail) {
                        if (err) winston.warn(err)

                        if (mail.headers.has('from')) {
                          message.from = mail.headers.get('from').value[0].address
                        }

                        if (mail.subject) {
                          message.subject = mail.subject
                        } else {
                          message.subject = message.from
                        }

                        if (_.isUndefined(mail.textAsHtml)) {
                          var $ = cheerio.load(mail.html)
                          var $body = $('body')
                          message.body = $body.length > 0 ? $body.html() : mail.html
                        } else {
                          message.body = mail.textAsHtml
                        }

                        mailCheck.messages.push(message)
                      })
                    })
                  })
                })

                f.on('end', function () {
                  mailCheck.Imap.addFlags(results, flag, function () {
                    mailCheck.Imap.closeBox(true, function () {
                      mailCheck.Imap.end()
                      handleMessages(mailCheck.messages, function () {
                        mailCheck.Imap.destroy()
                      })
                    })
                  })
                })
              }
            ],
            function (err) {
              if (err) winston.warn(err)
              mailCheck.Imap.end()
            }
          )
        }
      })
    })
  } catch (error) {
    winston.warn(error)
    mailCheck.Imap.end()
  }
}

mailCheck.fetchMail = function () {
  try {
    mailCheck.messages = []
    mailCheck.Imap.connect()
  } catch (err) {
    mailCheck.Imap.end()
    winston.warn(err)
  }
}

function handleMessages (messages, done) {
  var count = 0
  messages.forEach(function (message) {
    if (
      !_.isUndefined(message.from) &&
      !_.isEmpty(message.from) &&
      !_.isUndefined(message.subject) &&
      !_.isEmpty(message.subject) &&
      !_.isUndefined(message.body) &&
      !_.isEmpty(message.body)
    ) {
      async.auto(
        {
          handleUser: function (callback) {
            userSchema.getUserByEmail(message.from, function (err, user) {
              if (err) winston.warn(err)
              if (!err && user) {
                message.owner = user
                return callback(null, user)
              }

              // User doesn't exist. Lets create public user... If we want too
              if (mailCheck.fetchMailOptions.createAccount) {
                userSchema.createUserFromEmail(message.from, function (err, response) {
                  if (err) return callback(err)

                  message.owner = response.user
                  message.group = response.group

                  return callback(null, response)
                })
              } else {
                return callback('No User found.')
              }
            })
          },
          handleGroup: [
            'handleUser',
            function (results, callback) {
              if (!_.isUndefined(message.group)) {
                return callback()
              }

              groupSchema.getAllGroupsOfUser(message.owner._id, function (err, group) {
                if (err) return callback(err)
                if (!group) return callback('Unknown group for user: ' + message.owner.email)

                if (_.isArray(group)) {
                  message.group = _.first(group)
                } else {
                  message.group = group
                }

                if (!message.group) {
                  groupSchema.create(
                    {
                      name: message.owner.email,
                      members: [message.owner._id],
                      sendMailTo: [message.owner._id],
                      public: true
                    },
                    function (err, group) {
                      if (err) return callback(err)
                      message.group = group
                      return callback(null, group)
                    }
                  )
                } else {
                  return callback(null, group)
                }
              })
            }
          ],
          handleTicketType: function (callback) {
            if (mailCheck.fetchMailOptions.defaultTicketType === 'Issue') {
              ticketTypeSchema.getTypeByName('Issue', function (err, type) {
                if (err) return callback(err)

                mailCheck.fetchMailOptions.defaultTicketType = type._id
                message.type = type

                return callback(null, type)
              })
            } else {
              ticketTypeSchema.getType(mailCheck.fetchMailOptions.defaultTicketType, function (err, type) {
                if (err) return callback(err)

                message.type = type

                return callback(null, type)
              })
            }
          },
          handlePriority: [
            'handleTicketType',
            function (result, callback) {
              var type = result.handleTicketType

              if (mailCheck.fetchMailOptions.defaultPriority !== '') {
                return callback(null, mailCheck.fetchMailOptions.defaultPriority)
              }

              var firstPriority = _.first(type.priorities)
              if (!_.isUndefined(firstPriority)) {
                mailCheck.fetchMailOptions.defaultPriority = firstPriority._id
              } else {
                return callback('Invalid default priority')
              }

              return callback(null, firstPriority._id)
            }
          ],
          handleStatus: function (callback) {
            statusSchema.getStatus(function (err, statuses) {
              if (err) return callback(err)

              const status = _.first(statuses)

              if (!status) return callback(new Error('Invalid status'))

              message.status = status._id

              return callback(null, status._id)
            })
          },
          handleCreateTicket: [
            'handleGroup',
            'handlePriority',
            'handleStatus',
            function (results, callback) {
              var HistoryItem = {
                action: 'ticket:created',
                description: 'Ticket was created.',
                owner: message.owner._id
              }

              Ticket.create(
                {
                  owner: message.owner._id,
                  group: message.group._id,
                  type: message.type._id,
                  status: results.handleStatus,
                  priority: results.handlePriority,
                  subject: message.subject,
                  issue: message.body,
                  history: [HistoryItem]
                },
                function (err, ticket) {
                  if (err) {
                    winston.warn('Failed to create ticket from email: ' + err)
                    return callback(err)
                  }

                  emitter.emit('ticket:created', {
                    socketId: '',
                    ticket: ticket
                  })

                  count++
                  return callback()
                }
              )
            }
          ]
        },
        function (err) {
          winston.debug('Created %s tickets from mail', count)
          if (err) winston.warn(err)
          return done(err)
        }
      )
    }
  })
}

function openInbox (cb) {
  mailCheck.Imap.openBox('INBOX', cb)
}
module.exports = mailCheck
