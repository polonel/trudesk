const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const async = require('async')
const Email = require('email-templates')

const logger = require('../../logger')
const winston = require('../../logger')
const sanitizeHtml = require('sanitize-html')

const userSchema = require('../../models/user')
const ticketSchema = require('../../models/ticket')
const settingSchema = require('../../models/setting')
const Department = require('../../models/department')
const settingsSchema = require('../../models/setting')
const templateSchema = require('../../models/template')
const NotificationSchema = require('../../models/notification')
const tcmSchema = require('../../models/tcm')

const util = require('../../helpers/utils')
const pathUpload = path.join(__dirname, `../../../public`)
const socketEvents = require('../../socketio/socketEventConsts')
const { head, filter, flattenDeep, concat, uniqBy } = require('lodash')
const templateDir = path.resolve(__dirname, '../../', 'mailer', 'templates')


function tcmUpdate(ticket, userId){

    tcmSchema.findOne({ _id: ticket._id}, (err,tcms)=>{
        if (err) console.log(err);
        tcms.users.length = 0;
        tcms.users.push(userId);
      })

}

function sendPushNotification(tpsObj, data) {
    const tpsEnabled = tpsObj.tpsEnabled
    const tpsUsername = tpsObj.tpsUsername
    const tpsApiKey = tpsObj.tpsApiKey
    const hostname = tpsObj.hostname
    let ticket = data.ticket
    const message = data.message

    if (!tpsEnabled || !tpsUsername || !tpsApiKey) {
        winston.debug('Warn: TPS - Push Service Not Enabled')
        return
    }

    if (!hostname) {
        winston.debug('Could not get hostname for push: ' + data.type)
        return
    }

    // Data
    // 1 - Ticket Created
    // 2 - Ticket Comment Added
    // 3 - Ticket Note Added
    // 4 - Ticket Assignee Set
    //  - Message
    let title
    let users = []
    let content, comment, assigneeId, ticketUid
    switch (data.type) {
        case 1:
            title = 'Ticket #' + ticket.uid + ' Created'
            content = ticket.owner.fullname + ' submitted a ticket'
            users = _.map(ticket.group.sendMailTo, function (o) {
                return o._id
            })
            break
        case 2:
            title = 'Ticket #' + ticket.uid + ' Updated'
            content = _.last(ticket.history).description
            comment = _.last(ticket.comments)
            users = _.compact(
                _.map(ticket.subscribers, function (o) {
                    if (comment.owner._id.toString() !== o._id.toString()) {
                        return o._id
                    }
                })
            )
            break
        case 3:
            title = message.owner.fullname + ' sent you a message'
            break
        case 4:
            assigneeId = data.assigneeId
            ticketUid = data.ticketUid
            ticket = {}
            ticket._id = data.ticketId
            ticket.uid = data.ticketUid
            title = 'Assigned to Ticket #' + ticketUid
            content = 'You were assigned to Ticket #' + ticketUid
            users = [assigneeId]
            break
        default:
            title = ''
    }

    if (_.size(users) < 1) {
        winston.debug('No users to push too | UserSize: ' + _.size(users))
        return
    }

    const n = {
        title: title,
        data: {
            ticketId: ticket._id,
            ticketUid: ticket.uid,
            users: users,
            hostname: hostname
        }
    }

    if (content) {
        n.content = content
    }

    notifications.pushNotification(tpsUsername, tpsApiKey, n)
}

module.exports = async (ticket, comment, hostname) => {
    tcmUpdate(ticket, comment.owner._id)
    settingsSchema.getSettingsByName(['tps:enable', 'tps:username', 'tps:apikey', 'mailer:enable'], function (
        err,
        tpsSettings
    ) {
        if (err) return false

        let tpsEnabled = _.head(_.filter(tpsSettings, ['name', 'tps:enable']))
        let tpsUsername = _.head(_.filter(tpsSettings, ['name', 'tps:username']))
        let tpsApiKey = _.head(_.filter(tpsSettings), ['name', 'tps:apikey'])
        let mailerEnabled = _.head(_.filter(tpsSettings), ['name', 'mailer:enable'])
        mailerEnabled = !mailerEnabled ? false : mailerEnabled.value

        if (!tpsEnabled || !tpsUsername || !tpsApiKey) {
            tpsEnabled = false
        } else {
            tpsEnabled = tpsEnabled.value
            tpsUsername = tpsUsername.value
            tpsApiKey = tpsApiKey.value
        }

        async.parallel(
            [
                function (cb) {
                    if (ticket.owner._id.toString() === comment.owner.toString()) return cb
                    if (!_.isUndefined(ticket.assignee) && ticket.assignee._id.toString() === comment.owner.toString())
                        return cb

                    const notification = new NotificationSchema({
                        owner: ticket.owner,
                        title: 'Comment Added to Ticket#' + ticket.uid,
                        message: ticket.subject,
                        type: 1,
                        data: { ticket: ticket },
                        unread: true
                    })

                    notification.save(function (err) {
                        return cb(err)
                    })
                },
                function (cb) {
                    if (_.isUndefined(ticket.assignee)) return cb()
                    if (ticket.assignee._id.toString() === comment.owner.toString()) return cb
                    if (ticket.owner._id.toString() === ticket.assignee._id.toString()) return cb()

                    const notification = new NotificationSchema({
                        owner: ticket.assignee,
                        title: 'Comment Added to Ticket#' + ticket.uid,
                        message: ticket.subject,
                        type: 2,
                        data: { ticket: ticket },
                        unread: true
                    })

                    notification.save(function (err) {
                        return cb(err)
                    })
                },
                function (cb) {
                    sendPushNotification(
                        {
                            tpsEnabled: tpsEnabled,
                            tpsUsername: tpsUsername,
                            tpsApiKey: tpsApiKey,
                            hostname: hostname
                        },
                        { type: 2, ticket: ticket }
                    )
                    return cb()
                },
                // Send email to subscribed users
                function (c) {
                    if (!mailerEnabled) return c()

                    const mailer = require('../../mailer')
                    let emails = []

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

                    const createNotification = async ticket => {
                        let members = await getTeamMembers(ticket.group)

                        members = concat(members, ticket.group.members)
                        members = uniqBy(members, i => i._id)

                        for (const member of members) {
                            if (!member) continue
                            await saveNotification(member, ticket)
                        }
                    }

                    const saveNotification = async (user, ticket) => {
                        const notification = new NotificationSchema({
                            owner: user,
                            title: `Comment added to ticket #${ticket.uid}`,
                            message: ticket.comments[ticket.comments.length - 1].comment.replace(/<\/?[a-zA-Z]+>/gi, ''),
                            type: 0,
                            data: { ticket },
                            unread: true
                        })

                        await notification.save()
                    }
                    
                    createNotification(ticket)
                    util.sendToAllConnectedClients(io, socketEvents.TICKETS_CREATED, ticket)

                    async.each(
                        ticket.subscribers,
                        function (member, cb) {
                            if (_.isUndefined(member) || _.isUndefined(member.email)) return cb()
                            if (member._id.toString() === comment.owner.toString()) return cb()
                            if (member.deleted) return cb()

                            emails.push(member.email)

                            cb()
                        },
                        function (err) {
                            if (err) return c(err)

                            emails = _.uniq(emails)

                            if (_.size(emails) < 1) {
                                return c()
                            }

                            const sendMail = async (ticket, emails, baseUrl, betaEnabled, templateName) => {
                                let email = null
                                if (betaEnabled) {
                                    email = new Email({
                                        render: (view, locals) => {
                                            return new Promise((resolve, reject) => {
                                                ; (async () => {
                                                    try {
                                                        if (!global.Handlebars) return reject(new Error('Could not load global.Handlebars'))
                                                        const template = await templateSchema.findOne({ name: view })
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

                                const template = await templateSchema.findOne({ name: templateName })

                                if (template) {

                                    const ticketJSON = ticket.toJSON()
                                    ticketJSON.status = ticket.statusFormatted
                                    if (ticketJSON.assignee) {
                                        const assignee = await userSchema.findOne({ _id: ticketJSON.assignee })
                                        ticketJSON.assignee = assignee.fullname
                                    }

                                    const attachmentsForSendMail = []
                                    if (comment.attachments) {
                                        for (const attachment of comment.attachments) {
                                            const attachmentPath = pathUpload + attachment.path
                                            if (fs.existsSync(attachmentPath)) {
                                                attachmentsForSendMail.push({ name: attachment.name, path: attachmentPath })
                                            }
                                        }
                                    }

                                    const commentObject = {
                                        text: ticketJSON.comments.slice(-1)[0].comment.replace(/(<([^>]+)>)/gi, ""),
                                        owner: ticketJSON.comments.slice(-1)[0].owner.fullname,
                                        attachments: attachmentsForSendMail
                                    }
                                    const context = { base_url: baseUrl, ticket: ticketJSON, comment: commentObject }
                                    const html = await email.render(templateName, context)
                                    const subjectParsed = global.Handlebars.compile(template.subject)(context)
                                    const mailOptions = {
                                        to: emails.join(),
                                        subject: subjectParsed,
                                        html,
                                        generateTextFromHTML: true,
                                        attachments: commentObject.attachments
                                    }

                                    try {
                                        await mailer.sendMail(mailOptions)
                                    } catch (err) {
                                        console.log(err)
                                    }

                                    logger.debug(`Sent [${emails.length}] emails.`)
                                }
                            }

                            const configForSendMail = async (ticket, templateName) => {
                                const ticketObject = ticket
                                try {
                                    const ticket = await ticketSchema.getTicketById(ticketObject._id)
                                    const settings = await settingSchema.getSettingsByName(['gen:siteurl', 'mailer:enable', 'beta:email'])
                                    const ticketJSON = ticket.toJSON()
                                    const baseUrl = head(filter(settings, ['name', 'gen:siteurl'])).value
                                    let mailerEnabled = head(filter(settings, ['name', 'mailer:enable']))
                                    mailerEnabled = !mailerEnabled ? false : mailerEnabled.value
                                    let betaEnabled = head(filter(settings, ['name', 'beta:email']))
                                    betaEnabled = !betaEnabled ? false : betaEnabled.value

                                    //++ ShaturaPro LIN 14.10.2022
                                    const emails = []
                                    if (ticket.owner.email && ticket.owner.email !== ''
                                        && ticketJSON.comments.splice(-1)[0].owner.email !== ticket.owner.email) {
                                        emails.push(ticket.owner.email)
                                    }

                                    if (mailerEnabled && emails.length !== 0) await sendMail(ticket, emails, baseUrl, betaEnabled, templateName)

                                } catch (e) {
                                    logger.warn(`[trudesk:events:ticket:status:change] - Error: ${e}`)
                                }
                            }

                            ticket.populate('comments.owner', function (err, ticket) {
                                if (err) winston.warn(err)
                                if (err) return c()

                                ticket = ticket.toJSON()
                                ticket.comments = ticket.comments.splice(-1)
                                configForSendMail(ticket, 'comment-added')
                            })
                        }
                    )
                }
            ],
            function () {
                // Blank
            }
        )
    })
}