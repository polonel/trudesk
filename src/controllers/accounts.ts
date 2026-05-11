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

import async from 'async'
import _ from 'lodash'
import winston from '../logger'
import { UserModel as userSchema } from '../models'
import permissions from '../permissions'
import emitter from '../emitter'
import xss from 'xss'
import path from 'path'

const accountsController: Record<string, any> = {}

accountsController.content = {}

function handleError(res: any, err: any) {
  if (err) {
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

accountsController.signup = function (_req: any, res: any) {
  const marked = require('marked')
  const settings = require('../models/setting')
  settings.getSettingByName('allowUserRegistration:enable', function (err: any, setting: any) {
    if (err) return handleError(res, err)
    if (setting && setting.value === true) {
      settings.getSettingByName('legal:privacypolicy', function (err: any, privacyPolicy: any) {
        if (err) return handleError(res, err)

        const content: Record<string, any> = {}
        content.title = 'Create Account'
        content.layout = false
        content.data = {}

        if (privacyPolicy === null || _.isUndefined(privacyPolicy.value)) {
          content.data.privacyPolicy = 'No Privacy Policy has been set.'
        } else {
          content.data.privacyPolicy = xss(marked.parse(privacyPolicy.value))
        }

        return res.render('pub_signup', content)
      })
    } else {
      return res.redirect('/')
    }
  })
}

accountsController.get = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:view')) {
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Accounts'
  content.nav = 'accounts'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  return res.render('accounts', content)
}

accountsController.getCustomers = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:view')) {
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Customers'
  content.nav = 'accounts'
  content.subnav = 'accounts-customers'

  content.data = {}
  content.data.user = user
  content.data.common = req.viewdata
  content.data.view = 'customers'

  return res.render('accounts', content)
}

accountsController.getAgents = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:view')) {
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Agents'
  content.nav = 'accounts'
  content.subnav = 'accounts-agents'

  content.data = {}
  content.data.user = user
  content.data.common = req.viewdata
  content.data.view = 'agents'

  return res.render('accounts', content)
}

accountsController.getAdmins = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:view')) {
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Admins'
  content.nav = 'accounts'
  content.subnav = 'accounts-admins'

  content.data = {}
  content.data.user = user
  content.data.common = req.viewdata
  content.data.view = 'admins'

  return res.render('accounts', content)
}

accountsController.importPage = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'accounts:import')) {
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Accounts - Import'
  content.nav = 'accounts'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  res.render('accounts_import', content)
}

accountsController.profile = function (req: any, res: any) {
  const user = req.user
  const backUrl = req.header('Referer') || '/'
  if (_.isUndefined(user)) {
    req.flash('message', 'Permission Denied.')
    winston.warn('Undefined User - /Profile')
    return res.redirect(backUrl)
  }

  const content: Record<string, any> = {}
  content.title = 'Profile'
  content.nav = 'profile'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.host = req.hostname
  content.data.account = {}

  async.parallel(
    {
      account: function (callback: any) {
        userSchema.findOne({ _id: req.user._id }).select('+accessToken +tOTPKey').exec().then((obj: any) => callback(null, obj)).catch((err: any) => callback(err))
      }
    },
    function (err: any, result: any) {
      if (err) {
        winston.warn(err)
        return res.redirect(backUrl)
      }

      content.data.account = result.account

      res.render('subviews/profile', content)
    }
  )
}

accountsController.bindLdap = function (req: any, res: any) {
  const ldap = require('../ldap')
  const postData = req.body
  if (_.isUndefined(postData)) return res.status(400).json({ success: false, error: 'Invalid Post Data.' })

  const server = postData['ldap-server']
  const dn = postData['ldap-bind-dn']
  const password = postData['ldap-password']
  const searchBase = postData['ldap-search-base']
  const filter = postData['ldap-filter']

  ldap.bind('ldap://' + server, dn, password, function (err: any) {
    if (err && !res.headersSent) return res.status(400).json({ success: false, error: err })

    ldap.search(searchBase, filter, function (err: any, results: any) {
      if (err && !res.headersSent) return res.status(400).json({ success: false, error: err })
      if (_.isUndefined(results)) return res.status(400).json({ success: false, error: 'Undefined Results' })

      const entries = results.entries
      let foundUsers: any = null
      ldap.unbind(function (err: any) {
        if (err && !res.headersSent) return res.status(400).json({ success: false, error: err })

        let mappedUsernames = _.map(entries, 'sAMAccountName')

        userSchema.find({ username: mappedUsernames }, function (err: any, users: any) {
          if (err && !res.headersSent) return res.status(400).json({ success: false, error: err })

          foundUsers = users

          mappedUsernames = _.map(foundUsers, 'username')

          _.each(mappedUsernames, function (mappedUsername: any) {
            const u = _.find(entries, function (f: any) {
              return f.sAMAccountName.toLowerCase() === mappedUsername.toLowerCase()
            })

            if (u) {
              let clonedUser = _.find(foundUsers, function (g: any) {
                return g.username.toLowerCase() === u.sAMAccountName.toLowerCase()
              })
              if (clonedUser) {
                clonedUser = _.clone(clonedUser)
                clonedUser.fullname = u.displayName
                clonedUser.email = u.mail
                clonedUser.title = u.title
              }
            }

            _.remove(entries, function (k: any) {
              return k.sAMAccountName.toLowerCase() === mappedUsername.toLowerCase()
            })
          })

          _.remove(entries, function (e: any) {
            return _.isUndefined(e.mail)
          })

          return res.json({
            success: true,
            addedUsers: entries,
            updatedUsers: foundUsers
          })
        })
      })
    })
  })
}

function processUsers(addedUserArray: any[], updatedUserArray: any[], item: any, callback: any) {
  userSchema.getByUsername(item.username).then(function (user: any) {
    if (user) {
      updatedUserArray.push(item)
    } else {
      addedUserArray.push(item)
    }

    return callback()
  }).catch(callback)
}

accountsController.uploadCSV = function (req: any, res: any) {
  const csv = require('fast-csv')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1
    }
  })

  const object: Record<string, any> = {}

  const parser = csv.parse()

  busboy.on('file', function (_name: any, file: any, _info: any) {
    object.csv = []

    file
      .on('readable', function () {
        let data
        while ((data = file.read()) !== null) {
          parser.write(data)
        }
      })
      .on('end', function () {
        parser.end()
      })
  })

  busboy.on('error', function (err: any) {
    res.status(400).json({ success: false, error: err })
  })

  parser
    .on('data', function (row: any) {
      object.csv.push(row)
    })
    .on('end', function () {
      if (object.csv.length < 1) {
        return res.json({ success: false, error: 'Invalid CSV. No title Row.' })
      }

      const titleRow = object.csv[0]
      const usernameIdx = _.findIndex(titleRow, function (i: any) {
        return i.toLowerCase() === 'username'
      })
      const fullnameIdx = _.findIndex(titleRow, function (i: any) {
        return i.toLowerCase() === 'name'
      })
      const emailIdx = _.findIndex(titleRow, function (i: any) {
        return i.toLowerCase() === 'email'
      })
      const titleIdx = _.findIndex(titleRow, function (i: any) {
        return i.toLowerCase() === 'title'
      })
      const roleIdx = _.findIndex(titleRow, function (i: any) {
        return i.toLowerCase() === 'role'
      })

      object.csv.splice(0, 1)

      object.csv = _.map(object.csv, function (item: any) {
        return _.assign(
          { username: item[usernameIdx] },
          { fullname: item[fullnameIdx] },
          { email: item[emailIdx] },
          { title: item[titleIdx] },
          { role: item[roleIdx] }
        )
      })

      const addedUsers: any[] = []
      const updatedUsers: any[] = []

      async.each(
        object.csv,
        function (item: any, next: any) {
          return processUsers(addedUsers, updatedUsers, item, next)
        },
        function (err: any) {
          if (err) {
            winston.warn(err.message)
            return res.json({ success: false, error: err })
          }

          return res.json({
            success: true,
            contents: object.csv,
            addedUsers: addedUsers,
            updatedUsers: updatedUsers
          })
        }
      )
    })

  req.pipe(busboy)
}

accountsController.uploadJSON = function (req: any, res: any) {
  const Busboy = require('busboy')
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1
    }
  })

  const addedUsers: any[] = []
  const updatedUsers: any[] = []

  const object: Record<string, any> = {}
  let error: any
  busboy.on('file', function (_fieldname: any, file: any, _filename: any, _encoding: any, mimetype: any) {
    if (mimetype.indexOf('application/json') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }
    let buffer = ''
    file.on('data', function (data: any) {
      buffer += data
    })

    file
      .on('end', function () {
        object.json = JSON.parse(buffer)
        const accounts = object.json.accounts
        if (_.isUndefined(accounts)) {
          return res.status(400).json({
            success: false,
            error: 'No accounts defined in JSON file.'
          })
        }

        async.eachSeries(
          accounts,
          function (item: any, next: any) {
            return processUsers(addedUsers, updatedUsers, item, next)
          },
          function (err: any) {
            if (err) {
              return res.status(400).json({ success: false, error: err })
            }

            return res.json({
              success: true,
              contents: object.json,
              addedUsers: addedUsers,
              updatedUsers: updatedUsers
            })
          }
        )
      })
      .setEncoding('utf8')
  })

  busboy.on('error', function (err: any) {
    return res.status(400).json({ success: false, error: err })
  })

  busboy.on('finish', function () {
    if (error) {
      return res.status(error.status).json({ success: false, error: error })
    }
  })

  req.pipe(busboy)
}

accountsController.uploadImage = function (req: any, res: any) {
  const fs = require('fs')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 3 // 3mb limit
    }
  })

  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif']

  const object: Record<string, any> = {}
  let error: any

  busboy.on('field', function (fieldname: any, val: any) {
    if (fieldname === '_id') object._id = val
    if (fieldname === 'username') object.username = val
  })

  busboy.on('file', function (_name: any, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    const ext = path.extname(filename)

    if (!allowedExts.includes(ext)) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/users')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filename = 'aProfile_' + object.username + path.extname(filename)
    object.filename = object.filename.replace('/', '').replace('..', '')
    object.filePath = path.join(savePath, object.filename)
    object.mimetype = mimetype

    file.on('limit', function () {
      error = {
        status: 400,
        message: 'File too large'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.once('finish', function () {
    if (error) {
      winston.warn(error)
      return res.status(error.status).send(error.message)
    }

    if (
      _.isUndefined(object._id) ||
      _.isUndefined(object.username) ||
      _.isUndefined(object.filePath) ||
      _.isUndefined(object.filename)
    ) {
      return res.status(400).send('Invalid Form Data')
    }

    if (!fs.existsSync(object.filePath)) return res.status(400).send('File Failed to Save to Disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg') {
      require('../helpers/utils').stripExifData(object.filePath)
    }

    userSchema.getUser(object._id).then(function (user: any) {
      user.image = object.filename

      user.save().then(function () {
        emitter.emit('trudesk:profileImageUpdate', {
          userid: user._id,
          img: user.image
        })

        return res.status(200).send('/uploads/users/' + object.filename)
      }).catch(function (err: any) { return handleError(res, err) })
    }).catch(function (err: any) {
      return handleError(res, err)
    })
  })

  req.pipe(busboy)
}

module.exports = accountsController
