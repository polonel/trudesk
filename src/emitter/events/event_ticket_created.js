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
 *  Updated:    4/20/22 2:12 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

const path = require('path')
const { head, filter, flattenDeep, concat, uniq, uniqBy, map, chain } = require('lodash')
const logger = require('../../logger')
const Ticket = require('../../models/ticket')
const User = require('../../models/user')
const Setting = require('../../models/setting')
const Department = require('../../models/department')
const Notification = require('../../models/notification')
const Template = require('../../models/template')
const Mailer = require('../../mailer')

const Email = require('email-templates')
const templateDir = path.resolve(__dirname, '../..', 'mailer', 'templates')
const permissions = require('../../permissions')

const socketUtils = require('../../helpers/utils')
const sharedVars = require('../../socketio/index').shared
const socketEvents = require('../../socketio/socketEventConsts')
const util = require('../../helpers/utils')

const sendSocketUpdateToUser = (user, ticket) => {
  socketUtils.sendToUser(
    sharedVars.sockets,
    sharedVars.usersOnline,
    user.username,
    '$trudesk:client:ticket:created',
    ticket
  )
}

const getTeamMembers = async group => {
  const departments = await Department.getDepartmentsByGroup(group._id)
  if (!departments) throw new Error('Group is not assigned to any departments. Exiting...')
  return flattenDeep(
    departments.map(department => {
      return department.teams.map(team => {
        return team.members.map(member => {
          return member
        })
      })
    })
  )
}

const parseMemberEmails = async ticket => {
  const emails = []

  const teamMembers = await getTeamMembers(ticket.group)

  let members = concat(teamMembers, ticket.group.members)
  let emailTo = concat(teamMembers, ticket.group.sendMailTo)

  emailTo = chain(emailTo)
    .filter(i => {
      return i.email !== ticket.owner.email
    })
    .map(i => i.email)
    .uniq()
    .value()

  members = uniqBy(members, i => i._id)

  for (const member of members) {
    if (member.deleted) continue

    sendSocketUpdateToUser(member, ticket)

    if (typeof member.email === 'undefined' || emailTo.indexOf(member.email) === -1) continue

    emails.push(member.email)
  }

  return uniq(emails)
}

const sendMail = async (ticket, emails, baseUrl, betaEnabled) => {
  let email = null

  if (betaEnabled) {
    email = new Email({
      render: (view, locals) => {
        return new Promise((resolve, reject) => {
          ; (async () => {
            try {
              if (!global.Handlebars) return reject(new Error('Could not load global.Handlebars'))
              const template = await Template.findOne({ name: view })
              if (!template) return reject(new Error('Invalid Template'))
              const html = global.Handlebars.compile(template.data['gjs-fullHtml'])(locals)
              const results = await email.juiceResources(html)
              return resolve(results)
            } catch (e) {
              return reject(e)
            }
          })()
        })
      }
    })
  } else {
    email = new Email({
      views: {
        root: templateDir,
        options: {
          extension: 'handlebars'
        }
      }
    })
  }

  const template = await Template.findOne({ name: 'new-ticket' })
  if (template) {
    const ticketJSON = ticket.toJSON()

    const context = { base_url: baseUrl, ticket: ticketJSON }

    const html = await email.render('new-ticket', context)
    const subjectParsed = global.Handlebars.compile(template.subject)(context)
    const mailOptions = {
      to: emails.join(),
      subject: subjectParsed,
      html,
      generateTextFromHTML: true
    }

    await Mailer.sendMail(mailOptions)

    logger.debug(`Sent [${emails.length}] emails.`)
  }
}

const createNotification = async ticket => {
  let members = await getTeamMembers(ticket.group)

  members = concat(members, ticket.group.members)
  members = uniqBy(members, i => i._id)

  for (const member of members) {
    if (!member) continue
    await saveNotification(member, ticket)
  }
}

const createPublicNotification = async ticket => {
  let rolesWithPublic = permissions.getRoles('ticket:public')
  rolesWithPublic = map(rolesWithPublic, 'id')
  const users = await User.getUsersByRoles(rolesWithPublic)

  for (const user of users) {
    await saveNotification(user, ticket)
  }
}

const saveNotification = async (user, ticket) => {
  const notification = new Notification({
    owner: user,
    title: `Ticket #${ticket.uid} Created`,
    message: ticket.subject,
    type: 0,
    data: { ticket },
    unread: true
  })

  await notification.save()
}

module.exports = async data => {
  const ticketObject = data.ticket
  const hostname = data.hostname

  try {
    const ticket = await Ticket.getTicketById(ticketObject._id)
    const settings = await Setting.getSettingsByName(['gen:siteurl', 'mailer:enable', 'beta:email'])

    const baseUrl = head(filter(settings, ['name', 'gen:siteurl'])).value
    let mailerEnabled = head(filter(settings, ['name', 'mailer:enable']))
    mailerEnabled = !mailerEnabled ? false : mailerEnabled.value
    let betaEnabled = head(filter(settings, ['name', 'beta:email']))
    betaEnabled = !betaEnabled ? false : betaEnabled.value

    //++ ShaturaPro LIN 14.10.2022
    //const [emails] = await Promise.all([parseMemberEmails(ticket)])
    const emails = []
    if (ticket.owner.email && ticket.owner.email !== '') {
      emails.push(ticket.owner.email)
    }

    if (mailerEnabled) await sendMail(ticket, emails, baseUrl, betaEnabled)
    if (ticket.group.public) await createPublicNotification(ticket)
    else await createNotification(ticket)

    util.sendToAllConnectedClients(io, socketEvents.TICKETS_CREATED, ticket)
  } catch (e) {
    logger.warn(`[trudesk:events:ticket:created] - Error: ${e}`)
  }
}
