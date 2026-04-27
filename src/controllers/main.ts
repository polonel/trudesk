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

import _ from 'lodash'
import path from 'path'
import crypto from 'crypto'
import passport from 'passport'
import winston from '../logger'
import xss from 'xss'
import { trudeskRoot } from '../config'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { UserModel as userSchema, SessionModel } from '../models'
import apiUtils from './api/apiUtils'
import moment from 'moment/moment'

const pkg = require('../../package')

const limiterSlowBruteByIP = new RateLimiterMemory({
  keyPrefix: 'login_fail_ip_per_day',
  points: 15,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60
})

const mainController: Record<string, any> = {}

mainController.content = {}

mainController.index = function (req: any, res: any) {
  const content: Record<string, any> = {}
  content.title = 'Login'
  content.layout = false
  content.flash = req.flash('loginMessage')

  const settingsUtil = require('../settings/settingsUtil')
  settingsUtil.getSettings(function (err: any, s: any) {
    if (err) throw new Error(err)
    const settings = s.settings
    content.siteTitle = settings.siteTitle.value

    content.allowUserRegistration = settings.allowUserRegistration.value
    content.mailerEnabled = settings.mailerEnabled.value

    content.colorPrimary = settings.colorPrimary.value
    content.colorSecondary = settings.colorSecondary.value
    content.colorTertiary = settings.colorTertiary.value

    content.pageLogo = '/img/defaultLogoDark.png'
    if (settings.hasCustomPageLogo.value && settings.customPageLogoFilename.value.length > 0) {
      content.pageLogo = '/assets/' + settings.customPageLogoFilename.value
    }

    if (settings.hasCustomFavicon.value && settings.customFaviconFilename.value.length > 0) {
      content.favicon = `/assets/${settings.customFaviconFilename.value}`
    } else {
      content.favicon = '/img/favicon.ico'
    }

    content.bottom = 'Trudesk ' + 'v' + pkg.version + '-' + 'C' + 'E'

    res.render('login', content)
  })
}

mainController.about = function (req: any, res: any) {
  const marked = require('marked')
  const settings = require('../models/setting')
  settings.getSettingByName('legal:privacypolicy', function (err: any, privacyPolicy: any) {
    if (err)
      return res.render('error', {
        layout: false,
        error: err,
        message: err.message
      })

    const content: Record<string, any> = {}
    content.title = 'About'
    content.nav = 'about'

    content.data = {}
    content.data.user = req.user
    content.data.common = req.viewdata

    content.data.version = pkg.version
    if (privacyPolicy === null || _.isUndefined(privacyPolicy.value)) {
      content.data.privacyPolicy = 'No Privacy Policy has been set.'
    } else {
      content.data.privacyPolicy = xss(marked.parse(privacyPolicy.value))
    }

    return res.render('about', content)
  })
}

mainController.dashboard = function (req: any, res: any) {
  const content: Record<string, any> = {}
  content.title = 'Dashboard'
  content.nav = 'dashboard'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  return res.render('dashboard', content)
}

mainController.loginPost = async function (req: any, res: any) {
  const ipAddress = req.ip
  const [resEmailAndIP] = await Promise.all([limiterSlowBruteByIP.get(ipAddress)])

  let retrySecs = 0
  if (resEmailAndIP !== null && resEmailAndIP.consumedPoints > 2) {
    retrySecs = Math.round(resEmailAndIP.msBeforeNext / 1000) || 1
  }

  if (retrySecs > 0) {
    res.set('Retry-After', retrySecs.toString())
    res.status(429).json({ success: false, timeout: retrySecs.toString() })
  } else {
    passport.authenticate('local', async function (err: any, user: any, obj: any) {
      if (err) {
        winston.error(err)
        return res.status(400).json({ success: false, error: err })
      }
      if (!user) {
        try {
          await limiterSlowBruteByIP.consume(ipAddress)
          return res.status(401).json({ success: false, flash: obj.flash })
        } catch (rlRejected: any) {
          if (rlRejected instanceof Error) throw rlRejected
          else {
            const timeout = String(Math.round(rlRejected.msBeforeNext / 1000)) || 1
            res.set('Retry-After', timeout)
            res.status(429).json({ success: false, timeout })
          }
        }
      }

      if (user) {
        let redirectUrl = '/dashboard'

        if (req.session.redirectUrl) {
          redirectUrl = req.session.redirectUrl
          req.session.redirectUrl = null
        }

        if (req.user.role === 'user') {
          redirectUrl = '/tickets'
        }

        req.logIn(user, function (err: any) {
          if (err) {
            winston.debug(err)
            return res.status(400).json({ success: false, error: err })
          }

          return res.status(200).json({ success: true, redirectUrl })
        })
      }
    })(req, res)
  }
}

mainController.verifymfa = async function (req: any, res: any, next: any) {
  const body = req.body
  if (!body.auth || !body.code) return res.status(401).json({ success: false })

  try {
    const decoded: any = apiUtils.verifyMFAToken(body.auth)
    const user = await userSchema.findOne({ _id: decoded.uid })
    if (!user) return res.status(401).json({ success: false })

    req.user = user
    passport.authenticate('totp', async function (err: any, success: any) {
      if (err) throw err

      if (!success) return res.status(401).json({ success: false })

      const hash = crypto.createHash('sha256')

      const session = await SessionModel.create({
        user: user._id,
        refreshToken: hash.update(user._id.toString()).digest('hex'),
        exp: moment()
          .utc()
          .add(96, 'hours')
          .toDate()
      })

      const cookie = {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30
      }

      const tokens = await apiUtils.generateJWTToken(user, session)

      res.cookie('_rft_', tokens.refreshToken, cookie)

      return apiUtils.sendApiSuccess(res, tokens)
    })(req, res, next)
  } catch (e) {
    return res.status(401).json({ success: false })
  }
}

mainController.logout = function (req: any, res: any) {
  req.session.l2auth = null
  req.session.destroy(function () {
    req.logout(function () {
      res.clearCookie('connect.sid')
      return res.redirect('/')
    })
  })
}

mainController.forgotL2Auth = function (req: any, res: any) {
  const data = req.body
  if (_.isUndefined(data['forgotl2auth-email'])) {
    return res.status(400).send('No Form Data')
  }

  const email = data['forgotl2auth-email']
  userSchema.getByEmail(email).then(function (user: any) {
    if (!user) {
      return res.status(400).send('Invalid Email: Account not found!')
    }

    const Chance = require('chance')
    const chance = new Chance()

    user.resetL2AuthHash = chance.hash({ casing: 'upper' })
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + 2)
    user.resetL2AuthExpire = expireDate

    user.save(function (err: any, savedUser: any) {
      if (err) {
        return res.status(400).send(err.message)
      }

      const mailer = require('../mailer')
      const Email = require('email-templates')
      const templateDir = path.resolve(__dirname, '..', 'mailer', 'templates')

      const emailObj = new Email({
        views: {
          root: templateDir,
          options: {
            extension: 'handlebars'
          }
        }
      })

      savedUser = savedUser.toJSON()

      const emailData = {
        base_url: req.protocol + '://' + req.get('host'),
        user: savedUser
      }

      emailObj
        .render('l2auth-reset', emailData)
        .then(function (html: string) {
          const mailOptions = {
            to: savedUser.email,
            subject: '[Trudesk] Account Recovery',
            html: html,
            generateTextFromHTML: true
          }

          mailer.sendMail(mailOptions, function (err: any) {
            if (err) {
              winston.warn(err)
              return res.status(400).send(err)
            }

            return res.send('OK')
          })
        })
        .catch(function (err: any) {
          winston.warn(err)
          return res.status(400).send(err.message)
        })
    })
  }).catch(function (err: any) {
    return res.status(400).send(err.message)
  })
}

mainController.forgotPass = async function (req: any, res: any) {
  try {
    const postEmail = req.body?.email
    if (!postEmail) {
      return res.status(400).send('No Form Data')
    }

    let user: any = await userSchema.findOne({ email: postEmail.toLowerCase(), deleted: false })
    if (!user) {
      return res.status(200).json({ success: true })
    }

    const Chance = require('chance')
    const chance = new Chance()

    user.resetPassHash = chance.hash({ casing: 'upper' })
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + 2)
    user.resetPassExpire = expireDate

    user = await user.save()

    const mailer = require('../mailer')
    const Email = require('email-templates')
    const templateDir = path.resolve(trudeskRoot(), 'src/mailer/templates')

    let emailObj: any = null
    let template: any = null

    user = user.toJSON()

    const emailData = {
      base_url: `${req.protocol}://${req.get('host')}`,
      user
    }

    const settingUtils = require('../settings/settingsUtil')
    const resultData = await settingUtils.getSettings()
    const settings = resultData.settings
    const betaEnabled = settings.emailBeta.value
    if (betaEnabled) {
      const templateSchema = require('../models/template')
      template = await templateSchema.findOne({ name: 'password-reset' })
      if (template) {
        emailObj = new Email({
          render: (view: string, locals: any) => {
            return new Promise((resolve, reject) => {
              ;(async () => {
                if (!(global as any).Handlebars) return reject(new Error('Count not load global.Handlebars'))
                const _template = await templateSchema.findOne({ name: view })
                if (!_template) return reject(new Error('Invalid Template'))
                const html = (global as any).Handlebars.compile(template.data['gjs-fullHtml'])(locals)
                emailObj.juiceResources(html).then(resolve)
              })()
            })
          }
        })
      }
    } else {
      emailObj = new Email({
        views: {
          root: templateDir,
          options: {
            extension: 'handlebars'
          }
        }
      })
    }

    let subject = '[Trudesk] Password Reset Request'
    if (template) subject = (global as any).Handlebars.compile(template.subject)(emailData)
    if (!emailObj) throw new Error('No Email was defined. Exiting...')

    emailObj.render('password-reset', emailData).then(async (html: string) => {
      const mailOptions = {
        to: user.email,
        subject,
        html,
        generateTextFromHTML: true
      }

      await mailer.sendMail(mailOptions)

      return res.json({ success: true })
    })
  } catch (e: any) {
    winston.warn(e)
    return res.status(500).json({ success: false, error: e.message })
  }
}

mainController.resetl2auth = function (req: any, res: any) {
  const hash = req.params.hash
  if (_.isUndefined(hash)) {
    return res.status(400).send('Invalid Link!')
  }

  userSchema.findOne({ resetL2AuthHash: hash }).then(async function (user: any) {
    if (!user) {
      return res.status(400).send('Invalid Link!')
    }

    const now = new Date()
    if (now < user.resetL2AuthExpire) {
      user.tOTPKey = undefined
      user.hasL2Auth = false
      user.resetL2AuthHash = undefined
      user.resetL2AuthExpire = undefined

      user.save(function (err: any, updated: any) {
        if (err) {
          return res.status(500).send(err.message)
        }

        const mailer = require('../mailer')
        const Email = require('email-templates')
        const templateDir = path.resolve(__dirname, '..', 'mailer', 'templates')

        const emailObj = new Email({
          views: {
            root: templateDir,
            options: {
              extension: 'handlebars'
            }
          }
        })

        updated = updated.toJSON()

        emailObj
          .render('l2auth-cleared', user)
          .then(function (html: string) {
            const mailOptions = {
              to: updated.email,
              subject: '[Trudesk] Two-Factor Authentication Removed!',
              html: html,
              generateTextFromHTML: true
            }

            mailer.sendMail(mailOptions, function (err: any) {
              if (err) {
                winston.warn(err)
                req.flash('loginMessage', err.message)
                return res.redirect(307, '/')
              }

              req.flash('loginMessage', 'Account Recovery Email Sent.')
              return mainController.logout(req, res)
            })
          })
          .catch(function (err: any) {
            winston.warn(err)
            req.flash('loginMessage', err.message)
            return res.status(400).send(err.message)
          })
      })
    } else {
      return res.status(400).send('Invalid Link!')
    }
  }).catch(function () {
    return res.status(400).send('Invalid Link!')
  })
}

mainController.resetPass = async (req: any, res: any) => {
  try {
    const hash = req.params.hash

    if (!hash) {
      return res.status(400).json({ success: false, error: 'Invalid Link!' })
    }

    let user: any = await userSchema.getUserByResetHash(hash)
    if (!user) return res.status(400).json({ success: false, error: 'Invalid' })

    const now = new Date()
    if (now < user.resetPassExpire) {
      const Chance = require('chance')
      const chance = new Chance()
      const gPass = chance.string({ alpha: true, length: 8 })

      user.resetPassHash = null
      user.resetPassExpire = null

      user = await user.save()

      const mailer = require('../mailer')
      const Email = require('email-templates')
      const templateDir = path.resolve(trudeskRoot(), 'src/mailer/templates')

      const emailObj = new Email({
        views: {
          root: templateDir,
          options: {
            extension: 'handlebars'
          }
        }
      })

      user = user.toJSON()

      const emailData = {
        password: gPass,
        user
      }

      emailObj.render('new-password', emailData).then(async (html: string) => {
        const mailOptions = {
          to: user.email,
          subject: '[Trudesk] New Password',
          html,
          generateTextFromHTML: true
        }

        await mailer.sendMail(mailOptions)

        const flash = 'Password reset successfully'

        return res.status(200).json({ success: true, flash })
      })
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err })
  }
}

mainController.l2authget = function (req: any, res: any) {
  if (!req.user || !req.user.hasL2Auth) {
    req.logout()
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Login'
  content.layout = false

  const settings = require('../models/setting')
  settings.getSettingByName('mailer:enable', function (err: any, setting: any) {
    if (err) {
      throw new Error(err)
    }

    if (!_.isNull(setting)) {
      content.mailerEnabled = setting.value
    }

    return res.render('login-otp', content)
  })
}

mainController.uploadFavicon = function (req: any, res: any) {
  const fs = require('fs')
  const settingUtil = require('../settings/settingsUtil')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limit: {
      file: 1,
      fileSize: 1024 * 1024 * 1
    }
  })

  const object: Record<string, any> = {}
  let error: any

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType

    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'favicon' + path.extname(filename))
    object.filename = 'favicon' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', function () {
      error = {
        stats: 400,
        message: 'File size too large. File size limit: 1mb'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) {
      winston.warn(error)
      return res.status(error.status).send(error.message)
    }

    if (_.isUndefined(object.filePath) || _.isUndefined(object.filename)) {
      return res.status(400).send('Invalid image data')
    }

    if (!fs.existsSync(object.filePath)) return res.status(400).send('File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg') {
      require('../helpers/utils').stripExifData(object.filePath)
    }

    settingUtil.setSetting('gen:customfavicon', true, function (err: any) {
      if (err) return res.status(400).send('Failed to save setting to database')

      settingUtil.setSetting('gen:customfaviconfilename', object.filename, function (err: any) {
        if (err) return res.status(400).send('Failed to save setting to database')

        return res.send(object.filename)
      })
    })
  })

  req.pipe(busboy)
}

mainController.uploadLogo = function (req: any, res: any) {
  const fs = require('fs')
  const settingUtil = require('../settings/settingsUtil')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 3
    }
  })

  const object: Record<string, any> = {}
  let error: any

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'topLogo' + path.extname(filename))
    object.filename = 'topLogo' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', function () {
      error = {
        stats: 400,
        message: 'File size too large. File size limit: 3mb'
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

    if (_.isUndefined(object.filePath) || _.isUndefined(object.filename)) {
      return res.status(400).send('Invalid image data')
    }

    if (!fs.existsSync(object.filePath)) return res.status(400).send('File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg') {
      require('../helpers/utils').stripExifData(object.filePath)
    }

    settingUtil.setSetting('gen:customlogo', true, function (err: any) {
      if (err) return res.status(400).send('Failed to save setting to database')

      settingUtil.setSetting('gen:customlogofilename', object.filename, function (err: any) {
        if (err) return res.status(400).send('Failed to save setting to database')

        return res.send(object.filename)
      })
    })
  })

  req.pipe(busboy)
}

mainController.uploadPageLogo = function (req: any, res: any) {
  const fs = require('fs')
  const settingUtil = require('../settings/settingsUtil')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 3
    }
  })

  const object: Record<string, any> = {}
  let error: any

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType

    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'pageLogo' + path.extname(filename))
    object.filename = 'pageLogo' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', function () {
      error = {
        stats: 400,
        message: 'File size too large. File size limit: 3mb'
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

    if (_.isUndefined(object.filePath) || _.isUndefined(object.filename)) {
      return res.status(400).send('Invalid image data')
    }

    if (!fs.existsSync(object.filePath)) return res.status(400).send('File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg') {
      require('../helpers/utils').stripExifData(object.filePath)
    }

    settingUtil.setSetting('gen:custompagelogo', true, function (err: any) {
      if (err) return res.status(400).send('Failed to save setting to database')

      settingUtil.setSetting('gen:custompagelogofilename', object.filename, function (err: any) {
        if (err) return res.status(400).send('Failed to save setting to database')

        return res.send(object.filename)
      })
    })
  })

  req.pipe(busboy)
}

module.exports = mainController
