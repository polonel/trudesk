/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

const ticketSchema = require('../models/ticket')
const async = require('async')
const path = require('path')
const _ = require('lodash')
const winston = require('../logger')
const groupSchema = require('../models/group')
const departmentSchema = require('../models/department')
const permissions = require('../permissions')
const xss = require('xss')
/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * @namespace
 * @description Controller for each Ticket View
 * @requires {@link Ticket}
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link Emitter}
 *
 */
const ticketsController = {}

/**
 * @name ticketsController.content
 * @description Main Content sent to the view
 */
ticketsController.content = {}

ticketsController.pubNewIssue = function (req, res) {
  const marked = require('marked')
  const settings = require('../models/setting')
  settings.getSettingByName('allowPublicTickets:enable', function (err, setting) {
    if (err) return handleError(res, err)
    if (setting && setting.value === true) {
      settings.getSettingByName('legal:privacypolicy', function (err, privacyPolicy) {
        if (err) return handleError(res, err)

        const content = {}
        content.title = 'New Issue'
        content.layout = false
        content.data = {}
        if (privacyPolicy === null || _.isUndefined(privacyPolicy.value)) {
          content.data.privacyPolicy = 'No Privacy Policy has been set.'
        } else {
          content.data.privacyPolicy = xss(marked.parse(privacyPolicy.value))
        }

        return res.render('pub_createTicket', content)
      })
    } else {
      return res.redirect('/')
    }
  })
}

/**
 * Get Ticket View based on ticket status
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getByStatus = function (req, res, next) {
  const url = require('url')
  let page = req.params.page
  if (_.isUndefined(page)) page = 0

  const processor = {}
  processor.title = 'Tickets'
  processor.nav = 'tickets'
  processor.subnav = 'tickets-'
  processor.renderpage = 'tickets'
  processor.pagetype = 'active'
  processor.object = {
    limit: 50,
    page: page,
    status: []
  }

  const fullUrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  })

  const pathname = new url.URL(fullUrl).pathname
  const arr = pathname.split('/')
  let tType = 'new'
  let s = 0
  if (_.size(arr) > 2) tType = arr[2]

  switch (tType) {
    case 'open':
      s = 1
      break
    case 'pending':
      s = 2
      break
    case 'closed':
      s = 3
      break
  }

  processor.subnav += tType
  processor.pagetype = tType
  processor.object.status.push(s)

  req.processor = processor
  return next()
}

/**
 * Get Ticket View based on ticket active tickets
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {function} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getActive = function (req, res, next) {
  let page = req.params.page
  if (_.isUndefined(page)) page = 0

  const processor = {}
  processor.title = 'Tickets'
  processor.nav = 'tickets'
  processor.subnav = 'tickets-active'
  processor.renderpage = 'tickets'
  processor.pagetype = 'active'
  processor.object = {
    limit: 50,
    page: page,
    status: [0, 1, 2]
  }

  req.processor = processor

  return next()
}

/**
 * Get Ticket View based on tickets assigned to a given user
 * _calls ```next()``` to send to processor_
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {callback} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getAssigned = function (req, res, next) {
  let page = req.params.page
  if (_.isUndefined(page)) page = 0

  const processor = {}
  processor.title = 'Tickets'
  processor.nav = 'tickets'
  processor.subnav = 'tickets-assigned'
  processor.renderpage = 'tickets'
  processor.pagetype = 'assigned'
  processor.object = {
    limit: 50,
    page: page,
    status: [0, 1, 2],
    assignedSelf: true,
    user: req.user._id
  }

  req.processor = processor

  return next()
}

/**
 * Get Ticket View based on tickets assigned to a given user
 * _calls ```next()``` to send to processor_
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @param {callback} next Sends the ```req.processor``` object to the processor
 * @see Ticket
 */
ticketsController.getUnassigned = function (req, res, next) {
  let page = req.params.page
  if (_.isUndefined(page)) page = 0

  const processor = {}
  processor.title = 'Tickets'
  processor.nav = 'tickets'
  processor.subnav = 'tickets-unassigned'
  processor.renderpage = 'tickets'
  processor.pagetype = 'unassigned'
  processor.object = {
    limit: 50,
    page: page,
    status: [0, 1, 2],
    unassigned: true,
    user: req.user._id
  }

  req.processor = processor

  return next()
}

ticketsController.filter = function (req, res, next) {
  let page = req.query.page
  if (_.isUndefined(page)) page = 0

  const queryString = req.query
  const uid = queryString.uid
  const subject = queryString.fs
  const issue = queryString.it
  const dateStart = queryString.ds
  const dateEnd = queryString.de
  let status = queryString.st
  let priority = queryString.pr
  let groups = queryString.gp
  let types = queryString.tt
  let tags = queryString.tag
  let assignee = queryString.au

  const rawNoPage = req.originalUrl.replace(/[?&]page=[^&#]*(#.*)?$/, '$1').replace(/([?&])page=[^&]*&/, '$1')

  if (!_.isUndefined(status)) status = xss(status)
  if (!_.isUndefined(status) && !_.isArray(status)) status = [status]
  if (!_.isUndefined(priority)) priority = xss(priority)
  if (!_.isUndefined(priority) && !_.isArray(priority)) priority = [priority]
  if (!_.isUndefined(groups)) groups = xss(groups)
  if (!_.isUndefined(groups) && !_.isArray(groups)) groups = [groups]
  if (!_.isUndefined(types)) types = xss(types)
  if (!_.isUndefined(types) && !_.isArray(types)) types = [types]
  if (!_.isUndefined(tags)) tags = xss(tags)
  if (!_.isUndefined(tags) && !_.isArray(tags)) tags = [tags]
  if (!_.isUndefined(assignee)) assignee = xss(assignee)
  if (!_.isUndefined(assignee) && !_.isArray(assignee)) assignee = [assignee]

  const filter = {
    uid: uid,
    subject: xss(subject),
    issue: issue,
    date: {
      start: dateStart,
      end: dateEnd
    },
    status: status,
    priority: priority,
    groups: groups,
    tags: tags,
    types: types,
    assignee: assignee,
    raw: rawNoPage
  }

  const processor = {}
  processor.title = 'Tickets'
  processor.nav = 'tickets'
  processor.renderpage = 'tickets'
  processor.pagetype = 'filter'
  processor.filter = filter
  processor.object = {
    limit: 50,
    page: page,
    status: filter.status,
    user: req.user._id,
    filter: filter
  }

  req.processor = processor

  return next()
}

/**
 * Process the ```req.processor``` object and render the correct view
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Tickets View
 * @see Ticket
 */
ticketsController.processor = function (req, res) {
  const processor = req.processor
  if (_.isUndefined(processor)) return res.redirect('/')

  const content = {}
  content.title = processor.title
  content.nav = processor.nav
  content.subnav = processor.subnav
  content.view = processor.pagetype

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  const object = processor.object
  content.data.page = object.page
  content.data.filter = object.filter

  return res.render(processor.renderpage, content)
}

ticketsController.pdf = function (req, res) {
  const TicketPDFGenerator = require('../pdf/ticketGenerator')
  let uid = null
  try {
    uid = parseInt(req.params.uid)
  } catch (e) {
    winston.warn(e)
    return res.status(404).send('Invalid Ticket UID')
  }

  ticketSchema.getTicketByUid(uid, function (err, ticket) {
    if (err) return handleError(res, err)

    const ticketGenerator = new TicketPDFGenerator(ticket)

    ticketGenerator.generate(function (err, obj) {
      if (err) return res.redirect('/tickets')

      return res.writeHead(200, obj.headers).end(obj.data)
    })
  })
}

/**
 * Print Ticket View
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Subviews/PrintTicket View
 */
ticketsController.print = function (req, res) {
  const user = req.user
  let uid = null
  try {
    uid = parseInt(req.params.uid)
  } catch (e) {
    winston.warn(e)
    return res.redirect('/tickets')
  }

  const content = {}
  content.title = 'Tickets - ' + req.params.uid
  content.nav = 'tickets'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.ticket = {}

  ticketSchema.getTicketByUid(uid, function (err, ticket) {
    if (err) return handleError(res, err)
    if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets')

    const hasPublic = permissions.canThis(user.role, 'tickets:public')
    let hasAccess = false
    async.series(
      [
        function (next) {
          if (user.role.isAdmin || user.role.isAgent) {
            departmentSchema.getDepartmentGroupsOfUser(user._id, function (err, groups) {
              if (err) return res.redirect('/tickets')
              const gIds = groups.map(function (g) {
                return g._id
              })

              if (_.some(gIds, ticket.group._id)) {
                if (!permissions.canThis(user.role, 'tickets:notes')) {
                  ticket.notes = []
                }

                hasAccess = true
                return next()
              } else {
                return next('UNAUTHORIZED_GROUP_ACCESS')
              }
            })
          } else {
            return next()
          }
        },
        function (next) {
          if (hasAccess) return next()

          const members = ticket.group.members.map(function (m) {
            return m._id.toString()
          })

          if (!members.includes(user._id.toString())) {
            if (ticket.group.public && hasPublic) {
              // Blank to bypass
            } else {
              return next('UNAUTHORIZED_GROUP_ACCESS')
            }
          }

          if (!permissions.canThis(user.role, 'tickets:notes')) {
            ticket.notes = []
          }

          return next()
        }
      ],
      function (err) {
        if (err) {
          if (err === 'UNAUTHORIZED_GROUP_ACCESS')
            winston.warn(
              'User tried to access ticket outside of group - UserId: ' + user._id + ' (' + user.username + ')'
            )

          return res.redirect('/tickets')
        }

        content.data.ticket = ticket
        content.data.ticket.priorityname = ticket.priority.name
        content.data.ticket.tagsArray = ticket.tags
        content.data.ticket.commentCount = _.size(ticket.comments)
        content.layout = 'layout/print'

        return res.render('subviews/printticket', content)
      }
    )
  })
}

/**
 * Get Single Ticket view based on UID
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Single Ticket View
 * @see Ticket
 * @example
 * //Content Object
 * content.title = "Tickets - " + req.params.id;
 * content.nav = 'tickets';
 *
 * content.data = {};
 * content.data.user = req.user;
 * content.data.common = req.viewdata;
 *
 * //Ticket Data
 * content.data.ticket = ticket;
 * content.data.ticket.priorityname = getPriorityName(ticket.priority);
 * content.data.ticket.tagsArray = ticket.tags;
 * content.data.ticket.commentCount = _.size(ticket.comments);
 */
ticketsController.single = function (req, res) {
  const user = req.user
  const uid = req.params.id
  if (isNaN(uid)) {
    return res.redirect('/tickets')
  }

  const content = {}
  content.title = 'Tickets - ' + req.params.id
  content.nav = 'tickets'

  content.data = {}
  content.data.user = user
  content.data.common = req.viewdata
  content.data.ticket = {}

  ticketSchema.getTicketByUid(uid, function (err, ticket) {
    if (err) return handleError(res, err)
    if (_.isNull(ticket) || _.isUndefined(ticket)) return res.redirect('/tickets')

    const departmentSchema = require('../models/department')
    async.waterfall(
      [
        function (next) {
          if (!req.user.role.isAdmin && !req.user.role.isAgent) {
            return groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, next)
          }

          departmentSchema.getUserDepartments(req.user._id, function (err, departments) {
            if (err) return next(err)
            if (_.some(departments, { allGroups: true })) {
              return groupSchema.find({}, next)
            }

            const groups = _.flattenDeep(
              departments.map(function (d) {
                return d.groups
              })
            )

            return next(null, groups)
          })
        },
        function (userGroups, next) {
          const hasPublic = permissions.canThis(user.role, 'tickets:public')
          const groupIds = userGroups.map(function (g) {
            return g._id.toString()
          })

          if (!groupIds.includes(ticket.group._id.toString())) {
            if (ticket.group.public && hasPublic) {
              // Blank to bypass
            } else {
              winston.warn('User access ticket outside of group - UserId: ' + user._id)
              return res.redirect('/tickets')
            }
          }

          if (!permissions.canThis(user.role, 'comments:view')) ticket.comments = []

          if (!permissions.canThis(user.role, 'tickets:notes')) ticket.notes = []

          content.data.ticket = ticket
          content.data.ticket.priorityname = ticket.priority.name

          return next()
        }
      ],
      function (err) {
        if (err) {
          winston.warn(err)
          return res.redirect('/tickets')
        }

        return res.render('subviews/singleticket', content)
      }
    )
  })
}

ticketsController.uploadImageMDE = function (req, res) {
  const Chance = require('chance')
  const chance = new Chance()
  const fs = require('fs-extra')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 5 * 1024 * 1024 // 5mb limit
    }
  })

  const object = {}
  let error

  object.ticketId = req.headers.ticketid
  if (!object.ticketId) return res.status(400).json({ success: false })

  busboy.on('file', function (name, file, info) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 500,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const ext = path.extname(filename)
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.jpe',
      '.jif',
      '.jfif',
      '.jfi',
      '.png',
      '.gif',
      '.webp',
      '.tiff',
      '.tif',
      '.bmp',
      '.dib',
      '.heif',
      '.heic'
    ]

    if (!allowedExtensions.includes(ext.toLocaleLowerCase())) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/tickets', object.ticketId)
    // const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const sanitizedFilename = chance.hash({ length: 20 }) + ext
    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, 'inline_' + sanitizedFilename)
    object.filename = sanitizedFilename
    object.mimetype = mimetype

    if (fs.existsSync(object.filePath)) {
      error = {
        status: 500,
        message: 'File already exists'
      }

      return file.resume()
    }

    file.on('limit', function () {
      error = {
        status: 500,
        message: 'File too large'
      }

      // Delete the temp file
      if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath)

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).send(error.message)

    if (_.isUndefined(object.ticketId) || _.isUndefined(object.filename) || _.isUndefined(object.filePath)) {
      return res.status(400).send('Invalid Form Data')
    }

    // Everything Checks out lets make sure the file exists and then add it to the attachments array
    if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk')

    const fileUrl = '/uploads/tickets/' + object.ticketId + '/inline_' + object.filename

    return res.json({ filename: fileUrl, ticketId: object.ticketId })
  })

  req.pipe(busboy)
}

ticketsController.uploadAttachment = function (req, res) {
  const fs = require('fs-extra')
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

    const savePath = path.join(__dirname, '../../public/uploads/tickets', object.ticketId)
    const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase()

    const ext = path.extname(sanitizedFilename)
    const badExts = ['.html', '.htm', '.js']

    if (badExts.includes(ext)) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, 'attachment_' + sanitizedFilename)
    object.filename = sanitizedFilename
    object.mimetype = mimetype

    if (fs.existsSync(object.filePath)) {
      error = {
        status: 500,
        message: 'File already exists'
      }

      return file.resume()
    }

    file.on('limit', function () {
      error = {
        status: 500,
        message: 'File too large'
      }

      // Delete the temp file
      if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath)

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).send(error.message)

    if (_.isUndefined(object.ticketId) || _.isUndefined(object.ownerId) || _.isUndefined(object.filePath)) {
      fs.unlinkSync(object.filePath)
      return res.status(400).send('Invalid Form Data')
    }

    // Everything Checks out lets make sure the file exists and then add it to the attachments array
    if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk')

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

  req.pipe(busboy)
}

function handleError (res, err) {
  if (err) {
    winston.warn(err)
    if (!err.status) res.status = 500
    else res.status = err.status
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

module.exports = ticketsController
