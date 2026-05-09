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

var winston = require('winston')

var path = require('path')

var fs = require('fs')

var axios = require('axios').default

var rimraf = require('rimraf')

var mkdirp = require('mkdirp')

var tar = require('tar')

var apiPlugins = {}

var pluginPath = path.join(__dirname, '../../../../plugins')

var pluginServerUrl = 'http://plugins.trudesk.io'

apiPlugins.installPlugin = async function (req, res) {
  var packageid = req.params.packageid

  let pluginRes
  try {
    pluginRes = await axios.get(pluginServerUrl + '/api/plugin/package/' + packageid)
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || err })
  }

  var plugin = pluginRes.data.plugin

  if (!plugin || !plugin.url) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Plugin: Not found in repository - ' + pluginServerUrl
    })
  }

  // Download the tarball as a stream and pipe to disk
  var downloadPromise = new Promise((resolve, reject) => {
    axios.get(pluginServerUrl + '/plugin/download/' + plugin.url, { responseType: 'stream' })
      .then(response => {
        var fws = fs.createWriteStream(path.join(pluginPath, plugin.url))
        response.data.pipe(fws)

        response.data.on('end', resolve)
        response.data.on('error', reject)
      })
      .catch(reject)
  })

  try {
    await downloadPromise()
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || err })
  }

  // Extract plugin
  var pluginExtractFolder = path.join(pluginPath, plugin.name.toLowerCase())
  try {
    await new Promise((resolve, reject) => rimraf(pluginExtractFolder, reject))
    mkdirp.sync(pluginExtractFolder)

    var fileFullPath = path.join(pluginPath, plugin.url)
    await tar.extract({ C: pluginExtractFolder, file: path.join(pluginPath, plugin.url) })
    await new Promise((resolve, reject) => rimraf(fileFullPath, reject))
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || err })
  }

  // Fire-and-forget download counter increment
  axios.get(pluginServerUrl + '/api/plugin/package/' + plugin._id + '/increasedownloads').catch(() => {})

  res.json({ success: true, plugin: plugin })
  restartServer()
}

apiPlugins.removePlugin = async function (req, res) {
  var packageid = req.params.packageid

  let pluginRes
  try {
    pluginRes = await axios.get(pluginServerUrl + '/api/plugin/package/' + packageid)
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || err })
  }

  var plugin = pluginRes.data.plugin

  if (plugin === null) {
    return res.json({ success: false, error: 'Invalid Plugin' })
  }

  try {
    await new Promise((resolve, reject) => rimraf(path.join(pluginPath, plugin.name.toLowerCase()), reject))
    res.json({ success: true })
    restartServer()
  } catch (err) {
    winston.debug(err)
    return res.json({ success: false, error: 'Unable to remove plugin directory.' })
  }
}

function restartServer () {
  var pm2 = require('pm2')
  pm2.connect(function (err) {
    if (err) {
      winston.error(err)
    }

    pm2.restart('trudesk', function (err) {
      if (err) {
        return winston.error(err)
      }

      pm2.disconnect()
    })
  })
}

module.exports = apiPlugins
