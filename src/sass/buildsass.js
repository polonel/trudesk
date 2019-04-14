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

var _ = require('lodash')
var path = require('path')
var sass = require('node-sass')
var settingUtil = require('../settings/settingsUtil')

var buildsass = {}

var sassOptionsDefaults = {
  indentedSyntax: true,
  includePaths: [path.join(__dirname, '../../src/sass')],
  outputStyle: 'compressed'
}

function sassVariable (name, value) {
  return '$' + name + ': ' + value + '\n'
}

function sassVariables (variablesObj) {
  return Object.keys(variablesObj)
    .map(function (name) {
      return sassVariable(name, variablesObj[name])
    })
    .join('\n')
}

function sassImport (path) {
  return "@import '" + path + "'\n"
}

function dynamicSass (entry, vars, success, error) {
  var dataString = sassVariables(vars) + sassImport(entry)
  var sassOptions = _.assign({}, sassOptionsDefaults, {
    data: dataString
  })

  sass.render(sassOptions, function (err, result) {
    return err ? error(err) : success(result.css.toString())
  })
}

function save (result) {
  var fs = require('fs')
  var themeCss = path.join(__dirname, '../../public/css/app.min.css')
  fs.writeFileSync(themeCss, result)
}

buildsass.buildDefault = function (callback) {
  dynamicSass(
    'app.sass',
    {},
    function (result) {
      save(result)
      return callback()
    },
    callback
  )
}

buildsass.build = function (callback) {
  settingUtil.getSettings(function (err, s) {
    if (!err && s) {
      var settings = s.data.settings

      dynamicSass(
        'app.sass',
        {
          header_background: settings.colorHeaderBG.value,
          header_primary: settings.colorHeaderPrimary.value,
          primary: settings.colorPrimary.value,
          secondary: settings.colorSecondary.value,
          tertiary: settings.colorTertiary.value,
          quaternary: settings.colorQuaternary.value
        },
        function (result) {
          save(result)
          return callback()
        },
        callback
      )
    } else {
      // Build Defaults
      dynamicSass(
        'app.sass',
        {},
        function (result) {
          save(result)
          return callback()
        },
        callback
      )
    }
  })
}

module.exports = buildsass
