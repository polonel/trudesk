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
const sanitizeHtml = require('sanitize-html')
const xss = require('xss')
const fs = require('fs')
const emitter = require('../emitter')
const userSchema = require('../models/user')
const groupSchema = require('../models/group')
const ticketTypeSchema = require('../models/tickettype')
const Ticket = require('../models/ticket')
const settingSchema = require('../models/setting')
const path = require('path')
const pathUploads = path.join(__dirname, `../../public/uploads`)
const pathUploadsTickets = path.join(__dirname, `../../public/uploads/tickets`)

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

function bindImapError() {
  mailCheck.Imap.on('error', function (err) {
    winston.error(err)
  })
}

function bindImapReady() {
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

                // var message = {}

                var f = mailCheck.Imap.fetch(results, {
                  bodies: ''
                })
                let mailsCount = 0
                let messagesCount = 0
                let attachmentsInMail = false
                f.on('message', function (msg) {
                  msg.on('body', function (stream) {
                    var buffer = ''
                    stream.on('data', function (chunk) {
                      buffer += chunk.toString('utf8')
                    })
                    stream.once('end', function () {
                      mailsCount++
                      simpleParser(buffer, function (err, mail) {

                        messagesCount++
                        if (err) winston.warn(err)
                        let message = {}

                        if (!mail.html) {
                          mail.html = 'Не заполнено'
                        }

                        if (!mail.subject) {
                          mail.subject = 'Не заполнено'
                        }

                        if (mail.headers.has('from')) {
                          message.from = mail.headers.get('from').value[0].address
                          message.fromName = mail.headers.get('from').value[0].name
                        }


                        if (mail?.attachments.length !== 0) {
                          message.attachments = mail.attachments
                          attachmentsInMail = true
                        }

                        if (mail.subject) {
                          message.subject = mail.subject
                        } else {
                          message.subject = message.from
                        }

                        if (mail?.inReplyTo || mail.subject.toLowerCase().match(/re:/gs)) {
                          message.responseToComment = mail.text
                        }
                        // else {
                        //   message.responseToComment = message.from
                        // }

                        // if (mail.subject) {
                        //   message.subject = mail.subject
                        // } else {
                        //   message.subject = message.from
                        // }
                        if (_.isUndefined(mail.text) && (mail?.inReplyTo || mail.subject.toLowerCase().match(/re:/gs))) {
                          var $ = cheerio.load(mail.html)
                          var $body = $('body')
                          message.responseToComment = $body.length > 0 ? $body.html() : mail.html
                        } else {
                          if (mail?.inReplyTo) message.responseToComment = mail.text
                          message.mailText = true
                        }

                        if (_.isUndefined(mail.textAsHtml)) {
                          var $ = cheerio.load(mail.html)
                          var $body = $('body')
                          message.body = $body.length > 0 ? $body.html() : mail.html
                        } else {
                          message.body = mail.textAsHtml
                        }
                        mailCheck.messages.push(message)
                        if (mail?.attachments.length !== 0 && messagesCount == mailsCount) {
                          handleMessages(mailCheck.messages, function () {
                            mailCheck.Imap.destroy()
                          })
                        }

                      })
                    })
                  })
                })

                f.on('end', function () {
                  mailCheck.Imap.addFlags(results, flag, function () {
                    mailCheck.Imap.closeBox(true, function () {
                      mailCheck.Imap.end();
                      if (!attachmentsInMail && mailsCount == messagesCount) {
                        handleMessages(mailCheck.messages, function () {
                          mailCheck.Imap.destroy()
                        })
                      }
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

function handleMessages(messages, done) {
  var count = 0
  messages.forEach(function (message) {
    //Если сообщение с почты это ответ то действует следующий код
    if (!_.isUndefined(message?.responseToComment) &&
      !_.isEmpty(message?.responseToComment)) {
      userSchema.getUserByEmail(message.from, function (err, user) {
        if (err) winston.warn(err)
        if (!err && user) {

          var comment = message.responseToComment
          var owner = user._id

          if (!message.mailText) {
            comment = sanitizeHtml(comment).trim()
          }

          var resultTicketUID = message.subject.toLowerCase().match(/#\d+/);
          if (resultTicketUID) {
            resultTicketUID = resultTicketUID[0].replace(/[^0-9]/g, "")
          } else {
            resultTicketUID = comment.toLowerCase().match(/#\d+/);
            if (resultTicketUID) {
              resultTicketUID = resultTicketUID[0].replace(/[^0-9]/g, "")
            } else {
              return winston.warn('Нет номера заявки')
            }
          }

          var ticketUID = resultTicketUID;
          try {
            comment = comment.match(/(.*?)ОТВЕТ-КОММЕНТАРИЙ РАЗМЕЩАЙТЕ ВЫШЕ ЭТОЙ СТРОКИ/gs) || comment.match(/(.*?)Ответ-комментарий размещайте выше этой строки/gs);
            if (comment) {
              comment = comment[0].replace(/ОТВЕТ-КОММЕНТАРИЙ РАЗМЕЩАЙТЕ ВЫШЕ ЭТОЙ СТРОКИ/gi, '') || comment.match(/(.*?)Ответ-комментарий размещайте выше этой строки/gs);
            } else {
              comment = undefined;
            }
            if (comment.match(/\n.*\n$/)) {
              comment = comment.replace(comment.match(/\n.*\n$/)[0], '')
            }
            if (comment.match(/\n.*\n>$/)) {
              comment = comment.replace(comment.match(/\n.*\n>$/)[0], '')
            }
            if (comment.match(/\n.*\n> $/)) {
              comment = comment.replace(comment.match(/\n.*\n*> $/)[0], '')
            }
            if (comment.match(/\n.*$/)) {
              comment = comment.replace(comment.match(/\n.*$/)[0], '')
            }
            if (comment.match(/<blockquote>.*/)) {
              comment = comment.replace(comment.match(/<blockquote>.*/)[0], '')
            }
          } catch (err) {
            return winston.warn(err)
          }

          if (_.isUndefined(ticketUID)) return winston.warn('Invalid Post Data')
          Ticket.findOne({ uid: ticketUID }, async function (err, t) {
            if (err) return winston.warn('Invalid Post Data')
            if (!t) return winston.warn('Ticket not found')

            if (_.isUndefined(comment)) return winston.warn('Invalid Post Data')

            var marked = require('marked')
            marked.setOptions({
              breaks: true

            })

            comment = sanitizeHtml(comment).trim()
            var Comment = {
              owner: owner,
              date: new Date(),
              comment: xss(marked.parse(comment))
            }

            t.updated = Date.now()
            t.comments.push(Comment)
            var HistoryItem = {
              action: 'ticket:comment:added',
              description: 'Comment was added',
              owner: owner
            }
            t.history.push(HistoryItem)

            if (message.attachments) {

              const commentId = t.comments.filter(comment => {
                return comment.owner._id == Comment.owner
                  &&
                  comment.date == Comment.date
                  &&
                  comment.comment == Comment.comment
              })[0]._id

              const pathUploadTicket = `${pathUploadsTickets}/${t._id}`;
              const pathUploadComments = `${pathUploadsTickets}/${t._id}/comments`;
              const pathUploadCommentId = `${pathUploadsTickets}/${t._id}/comments/${commentId}`;

              try {
                if (!fs.existsSync(pathUploadTicket)) {
                  await fs.mkdirSync(`${pathUploadsTickets}/${t._id}`, function (err) {
                    if (err) return callback(err)
                    console.log(`Папка  успешно создана: ${pathUploadTicket}`)
                    return true
                  })
                }

                if (!fs.existsSync(pathUploadComments)) {
                  await fs.mkdirSync(`${pathUploadsTickets}/${t._id}/comments`, function (err) {
                    if (err) return callback(err)
                    console.log(`Папка  успешно создана: ${pathUploadComments}`)
                    return true
                  })
                }

                if (!fs.existsSync(pathUploadCommentId)) {
                  await fs.mkdirSync(`${pathUploadsTickets}/${t._id}/comments/${commentId}`, function (err) {
                    if (err) return callback(err)
                    console.log(`Папка  успешно создана: ${pathUploadCommentId}`)
                    return true
                  })
                }

              } catch (err) {
                return callback(err)
              }

              let countAttachments = 0
              try {
                for (const attachmentFromMessage of message.attachments) {
                  let sanitizedFilename = attachmentFromMessage.filename.replace(/[^а-яa-z0-9.]/gi, '_').toLowerCase()

                  await fs.writeFileSync(`${pathUploadsTickets}/${t._id}/comments/${commentId}/${sanitizedFilename}`, attachmentFromMessage.content);

                  const attachment = {
                    owner: Comment.owner,
                    name: sanitizedFilename,
                    path: `/uploads/tickets/${t._id}/comments/${commentId}/${sanitizedFilename}`,
                    type: attachmentFromMessage.contentType
                  }
                  t.attachments.push(attachment)

                  let commentForAttachFile = t.comments.filter(function (comment) {
                    return comment._id == commentId;
                  })[0];
                  commentForAttachFile.attachments.push(attachment)

                  const historyItem = {
                    action: 'ticket:added:attachment',
                    description: 'Attachment ' + sanitizedFilename + ' was added.',
                    owner: Comment.owner
                  }
                  t.history.push(historyItem)
                  countAttachments++
                }
              } catch (err) {
                return callback(err)
              }

              // t.updated = Date.now()
              if (countAttachments = message.attachments.length) {
                t.save(function (err, tt) {
                  if (err) return winston.warn(err.message)
                  settingSchema.findOne({ name: 'gen:siteurl' }, (err, url) => {
                    if (err) console.log(err);
                    const hostname = url.value.replace('https://', '');
                    emitter.emit('ticket:comment:added', tt, Comment, hostname)
                    return winston.warn({ success: true, error: null, ticket: tt })
                  })
                })
              }
            } else {
              t.save(function (err, tt) {
                if (err) return winston.warn(err.message)
                settingSchema.findOne({ name: 'gen:siteurl' }, (err, url) => {
                  if (err) console.log(err);
                  const hostname = url.value.replace('https://', '');
                  emitter.emit('ticket:comment:added', tt, Comment, hostname)
                  return winston.warn({ success: true, error: null, ticket: tt })
                })
              })
            }
          })

          return true
        }
      })


    }

    else {
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
                  userSchema.createUserFromEmail(message.from, message.fromName, function (err, response) {
                    if (err) return callback(err)

                    message.owner = response.user
                    message.group = response.group
                    message.userPassword = response.userPassword

                    emitter.emit('user:created', {
                      socketId: '',
                      user: response.user,
                      userPassword: response.userPassword
                    })
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
                  if (!group || group.length == 0) {
                    settingSchema.findOne({ name: 'gen:defaultGroup' }, function (err, setting) {
                      groupSchema.findById(setting.value, function (err, group) {
                        if (err) return callback(err)
                        group.members.push(message.owner._id);
                        group.save();
                        message.group = group
                        return callback(null, group)

                      })
                    })
                  } else {
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
                  }
                })
              }
            ],
            handleTicketType: function (callback) {
              if (mailCheck.fetchMailOptions.defaultTicketType === 'Issue') {
                ticketTypeSchema.getTypeByName('Issue', function (err, type) {
                  if (err) {
                    winston.warn(err);
                    return callback(err);
                  }

                  mailCheck.fetchMailOptions.defaultTicketType = type._id
                  message.type = type

                  return callback(null, type)
                })
              } else {
                ticketTypeSchema.getType(mailCheck.fetchMailOptions.defaultTicketType, function (err, type) {
                  if (err) {
                    winston.warn(err);
                    return callback(err)
                  }

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
            handleCreateTicket: [
              'handleGroup',
              'handlePriority',
              function (results, callback) {
                var HistoryItem = {
                  action: 'ticket:created',
                  description: 'Ticket was created.',
                  owner: message.owner._id
                }

                Ticket.create(
                  {
                    owner: message.owner._id,
                    group: message.group?._id,
                    subscribers: message.owner._id,
                    type: message.type._id,
                    status: 0,
                    priority: results.handlePriority,
                    subject: message.subject,
                    issue: message.body,
                    history: [HistoryItem]
                  },
                  async function (err, ticket) {
                    if (err) {
                      winston.warn('Failed to create ticket from email: ' + err)
                      try {
                        return callback(err)
                      } catch {
                        winston.warn('Callback уже вызван')
                      }
                    }

                    try {

                      if (!fs.existsSync(`${pathUploads}`)) {
                        await fs.mkdirSync(`${pathUploads}`, err => {
                          if (err) console.log(err)
                        })
                      }

                      if (!fs.existsSync(`${pathUploadsTickets}`)) {
                        await fs.mkdirSync(`${pathUploadsTickets}`, err => {
                          if (err) console.log(err)
                        })
                      }
                    } catch (err) {
                      return callback(err)
                    }

                    emitter.emit('ticket:created', {
                      socketId: '',
                      ticket: ticket
                    })

                    if (message.attachments) {

                      await fs.mkdirSync(`${pathUploadsTickets}/${ticket._id}/`, err => {
                        if (err) throw err; // Не удалось создать папку
                        try {
                          for (const attachmentFromMessage of message.attachments) {
                            let sanitizedFilename = attachmentFromMessage.filename.replace(/[^а-яa-z0-9.]/gi, '_').toLowerCase()

                            fs.writeFileSync(`${pathUploadsTickets}/${ticket._id}/${sanitizedFilename}`, attachmentFromMessage.content);

                            const attachment = {
                              owner: message.owner._id,
                              name: sanitizedFilename,
                              path: `/uploads/tickets/${ticket._id}/${sanitizedFilename}`,
                              type: attachmentFromMessage.contentType
                            }
                            ticket.attachments.push(attachment)

                            const historyItem = {
                              action: 'ticket:added:attachment',
                              description: 'Attachment ' + sanitizedFilename + ' was added.',
                              owner: message.owner._id
                            }
                            ticket.history.push(historyItem)
                            ticket.updated = Date.now()
                          }
                        } catch (err) {
                          winston.warn(err)
                          try {
                            return callback(err)
                          } catch {
                            winston.warn('Callback уже вызван')
                          }
                        }
                        ticket.save(function (err, t) {
                          if (err) {
                            fs.unlinkSync(attachment.path)
                            winston.warn(err)
                            try {
                              return callback(err)
                            } catch {
                              winston.warn('Callback уже вызван')
                            }
                          }
                        })
                      });
                    }
                    count++
                    try {
                      return callback(err)
                    } catch {
                      winston.warn('Callback уже вызван')
                    }
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
    }
  })
}

function openInbox(cb) {
  mailCheck.Imap.openBox('INBOX', cb)
}
module.exports = mailCheck
