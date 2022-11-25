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
const Blob = require('buffer');
const fs = require('fs')
const emitter = require('../emitter')
const userSchema = require('../models/user')
const groupSchema = require('../models/group')
const ticketTypeSchema = require('../models/tickettype')
const Ticket = require('../models/ticket')
const settingSchema = require('../models/setting')
const axios = require('axios')

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
    mailCheck.Imap.on('end', function () {
      handleMessages(mailCheck.messages, function () {
        mailCheck.Imap.destroy()
      })
    })

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

                var message = {}

                var f = mailCheck.Imap.fetch(results, {
                  bodies: ''
                })

                f.on('message', function (msg) {
                  msg.on('body', function (stream) {
                    var buffer = ''
                    stream.on('data', function (chunk) {
                      buffer += chunk.toString('utf8')
                    })

                    stream.once('end', function () {
                      simpleParser(buffer, function (err, mail) {
                        if (err) winston.warn(err)

                        if (mail.headers.has('from')) {
                          message.from = mail.headers.get('from').value[0].address
                          message.fromName = mail.headers.get('from').value[0].name
                        }

                        if (mail?.attachments.length !== 0) {
                          message.attachments = mail.attachments
                        }

                        if (mail.subject) {
                          message.subject = mail.subject
                        } else {
                          message.subject = message.from
                        }

                        if (mail?.inReplyTo) {
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

                        if (_.isUndefined(mail.textAsHtml)) {
                          var $ = cheerio.load(mail.html)
                          var $body = $('body')
                          message.body = $body.length > 0 ? $body.html() : mail.html
                        } else {
                          message.body = mail.textAsHtml
                        }

                        mailCheck.messages.push(message)
                        if (mail?.attachments.length !== 0) {
                          handleMessages(mailCheck.messages, function () {
                            mailCheck.Imap.destroy()
                          })
                        }

                      })
                    })
                  })
                })

                f.on('end', function () {
                  async.series(
                    [
                      function (cb) {
                        mailCheck.Imap.addFlags(results, flag, cb)
                      },
                      function (cb) {
                        mailCheck.Imap.closeBox(true, cb)
                      }
                    ],
                    function (err) {
                      if (err) winston.warn(err)
                      return next()
                    }
                  )
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

          var resultTicketUID = comment.toLowerCase().match(/#\d+/);
          if (resultTicketUID) {
            resultTicketUID = resultTicketUID[0].replace(/[^0-9]/g, "")
          } else {
            return winston.warn('Нет номера заявки')
          }
          var ticketUID = resultTicketUID;

          comment = comment.match(/(.*?)Ответ-комментарий размещайте выше этой строки/gs);
          if (comment) {
            comment = comment[0].replace(/Ответ-комментарий размещайте выше этой строки/gi, '');
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



          if (_.isUndefined(ticketUID)) return winston.warn('Invalid Post Data')
          Ticket.findOne({ uid: ticketUID }, async function (err, t) {
            if (err) return winston.warn('Invalid Post Data')

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

            t.save(function (err, tt) {
              if (err) return winston.warn(err.message)
              settingSchema.findOne({ name: 'gen:siteurl' }, (err, url) => {
                if (err) console.log(err);
                const hostname = url.value.replace('https://', '');
                emitter.emit('ticket:comment:added', tt, Comment, hostname)

                return winston.warn({ success: true, error: null, ticket: tt })
              })

            })
            
            if (message.attachments) {
              await fs.mkdir(`/home/ilobanov/trudesk-dev/public/uploads/tickets/${t._id}/`, err => {
                if (err) throw err; // Не удалось создать папку
                console.log('Папка успешно создана');
                for (const attachmentFromMessage of message.attachments) {
                  let sanitizedFilename = attachmentFromMessage.filename.replace(/[^а-яa-z0-9.]/gi, '_').toLowerCase()

                  fs.writeFileSync(`/home/ilobanov/trudesk-dev/public/uploads/tickets/${t._id}/attachment_${sanitizedFilename}`, attachmentFromMessage.content);

                  const attachment = {
                    owner: message.owner._id,
                    name: sanitizedFilename,
                    path: `/uploads/tickets/${t._id}/attachment_${sanitizedFilename}`,
                    type: attachmentFromMessage.contentType
                  }
                  t.attachments.push(attachment)

                  const historyItem = {
                    action: 'ticket:added:attachment',
                    description: 'Attachment ' + sanitizedFilename + ' was added.',
                    owner: message.owner._id
                  }
                  t.history.push(historyItem)
                  t.updated = Date.now()
                }
                t.save(function (err, t) {
                  if (err) {
                    fs.unlinkSync(attachment.path)
                    winston.warn(err)
                    return callback(err)
                  }
                })
              });

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
                      return callback(err)
                    }

                    emitter.emit('ticket:created', {
                      socketId: '',
                      ticket: ticket
                    })

                    if (message.attachments) {
                      await fs.mkdir(`/home/ilobanov/trudesk-dev/public/uploads/tickets/${ticket._id}/`, err => {
                        if (err) throw err; // Не удалось создать папку
                        console.log('Папка успешно создана');
                        for (const attachmentFromMessage of message.attachments) {
                          let sanitizedFilename = attachmentFromMessage.filename.replace(/[^а-яa-z0-9.]/gi, '_').toLowerCase()

                          fs.writeFileSync(`/home/ilobanov/trudesk-dev/public/uploads/tickets/${ticket._id}/attachment_${sanitizedFilename}`, attachmentFromMessage.content);

                          const attachment = {
                            owner: message.owner._id,
                            name: sanitizedFilename,
                            path: `/uploads/tickets/${ticket._id}/attachment_${sanitizedFilename}`,
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
                        ticket.save(function (err, t) {
                          if (err) {
                            fs.unlinkSync(attachment.path)
                            winston.warn(err)
                            return callback(err)
                          }
                        })
                      });

                    }
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


    }
  })
}


function uploadAttachment(req) {
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 10 * 1024 * 1024 // 10mb limit
    }
  })

  const object = {
    ownerId: req.user._id
  }
  let error

  const events = []

  busboy.on('field', function (fieldname, val) {
    if (fieldname === 'ticketId') object.ticketId = val
    if (fieldname === 'ownerId') object.ownerId = val
  })

  busboy.on('file', function (name, file, info) {
    const filename = info.filename
    const mimetype = info.mimeType

    if (
      mimetype.indexOf('image/') === -1 &&
      mimetype.indexOf('text/plain') === -1 &&
      mimetype.indexOf('audio/mpeg') === -1 &&
      mimetype.indexOf('audio/mp3') === -1 &&
      mimetype.indexOf('audio/wav') === -1 &&
      mimetype.indexOf('application/x-zip-compressed') === -1 &&
      mimetype.indexOf('application/pdf') === -1 &&
      //  Office Mime-Types
      mimetype.indexOf('application/msword') === -1 &&
      mimetype.indexOf('application/vnd.openxmlformats-officedocument.wordprocessingml.document') === -1 &&
      mimetype.indexOf('application/vnd.ms-excel') === -1 &&
      mimetype.indexOf('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') === -1
    ) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    let filenameDecode = iconv.decode(filename, 'utf-8');
    const savePath = path.join(__dirname, '../../public/uploads/tickets', object.ticketId)
    let sanitizedFilename = filenameDecode.replace(/[^а-яa-z0-9.]/gi, '_').toLowerCase()

    const ext = path.extname(sanitizedFilename)
    const allowedExts = [
      '.png',
      '.jpg',
      '.jpeg',
      '.tif',
      '.gif',
      '.doc',
      '.docx',
      '.xlsx',
      '.xls',
      '.pdf',
      '.zip',
      '.rar',
      '.7z',
      '.mp3',
      '.wav',
      '.txt',
      '.mp4',
      '.avi',
      '.mpeg',
      '.eps',
      '.ai',
      '.psd'
    ]
    const badExts = ['.html', '.htm', '.js', '.svg']

    if (!allowedExts.includes(ext)) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, 'attachment_' + sanitizedFilename)
    object.filename = sanitizedFilename.replace('/', '').replace('..', '')
    object.mimetype = mimetype

    if (fs.existsSync(object.filePath)) {
      const Chance = require('chance')
      const chance = new Chance()
      sanitizedFilename = chance.hash({ length: 15 }) + '-' + sanitizedFilename
      object.filePath = path.join(savePath, 'attachment_' + sanitizedFilename)
      object.filename = sanitizedFilename
    }

    if (fs.existsSync(object.filePath)) {
      error = {
        status: 400,
        message: 'File already exists'
      }

      return file.resume()
    }

    file.on('limit', function () {
      error = {
        status: 400,
        message: 'File too large'
      }

      // Delete the temp file
      if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath)

      return file.resume()
    })

    const fstream = fs.createWriteStream(object.filePath)
    events.push(function (cb) {
      fstream.on('finish', cb)
    })

    file.pipe(fstream)
  })

  busboy.on('finish', function () {
    async.series(events, function () {
      if (error) return res.status(error.status).send(error.message)

      if (_.isUndefined(object.ticketId) || _.isUndefined(object.ownerId) || _.isUndefined(object.filePath)) {
        fs.unlinkSync(object.filePath)
        return res.status(400).send('Invalid Form Data')
      }

      // Everything Checks out lets make sure the file exists and then add it to the attachments array
      if (!fs.existsSync(object.filePath)) {
        winston.warn('Unable to save file to disk: ' + object.filePath)
        return res.status(500).send('File Failed to Save to Disk')
      }

      ticketSchema.getTicketById(object.ticketId, function (err, ticket) {
        if (err) {
          winston.warn(err)
          return res.status(500).send(err.message)
        }

        const attachment = {
          owner: object.ownerId,
          name: object.filename,
          path: '/uploads/tickets/' + object.ticketId + '/attachment_' + object.filename,
          type: object.mimetype
        }
        ticket.attachments.push(attachment)

        const historyItem = {
          action: 'ticket:added:attachment',
          description: 'Attachment ' + object.filename + ' was added.',
          owner: object.ownerId
        }
        ticket.history.push(historyItem)

        ticket.updated = Date.now()
        ticket.save(function (err, t) {
          if (err) {
            fs.unlinkSync(object.filePath)
            winston.warn(err)
            return res.status(500).send(err.message)
          }

          const returnData = {
            ticket: t
          }

          return res.json(returnData)
        })
      })
    })
  })

  req.pipe(busboy)
}



function openInbox(cb) {
  mailCheck.Imap.openBox('INBOX', cb)
}
module.exports = mailCheck
