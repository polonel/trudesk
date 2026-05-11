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

const fs = require('fs')
const path = require('path')
const sass = require('sass')
const settingUtil = require('../settings/settingsUtil')
const config = require('../config')

const buildsass = {}

const sassDir = path.resolve(config.trudeskRoot(), 'src/sass')

function sassVariable(name, value) {
  return '$' + name + ': ' + value + ';'
}

function sassVariables(variablesObj) {
  return Object.keys(variablesObj)
    .map(function (name) {
      return sassVariable(name, variablesObj[name])
    })
    .join('\n')
}

function sassImport(entryPath) {
  return "@import '" + entryPath + "'\n"
}

/**
 * Compile Sass by injecting dynamic variables as inline content.
 * Uses the legacy API's `data` option (equivalent to node-sass) for in-memory compilation.
 */
function callDynamicSass(entry, vars, success, error) {
  const dataString = sassVariables(vars) + sassImport(entry)

  const options = {
    style: 'compressed',
    indentedSyntax: true,
    quietDeps: true,
    silenceDeprecations: ['import'],
    loadPaths: [sassDir],
  }

  if (Object.keys(vars).length > 0) {
    // Dynamic variables present — use legacy API which supports `data` for inline content.
    try {
      const result = sass.compileString(dataString, options)
      success(result.css)
    } catch (e) {
      process.nextTick(error, e)
    }
  } else {
    // No dynamic variables — compile the entry file directly.
    const entryFile = path.join(sassDir, entry)
    sass.compileAsync(entryFile, options).then(
      function (result) {
        try {
          success(result.css)
        } catch (e) {
          return Promise.reject(e)
        }
      }
    ).catch(function (err) {
      process.nextTick(error, err)
    })
  }
}

function save(result) {
  const themeCss = path.resolve(config.trudeskRoot(), 'public/css/app.min.css')
  fs.writeFileSync(themeCss, result)
}

buildsass.buildDefault = function (callback) {
  callDynamicSass(
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
      const settings = s.settings

      callDynamicSass(
        'app.sass',
        {
          header_background: settings.colorHeaderBG.value,
          header_primary: settings.colorHeaderPrimary.value,
          primary: settings.colorPrimary.value,
          secondary: settings.colorSecondary.value,
          tertiary: settings.colorTertiary.value,
          quaternary: settings.colorQuaternary.value,
        },
        function (result) {
          save(result)
          return callback()
        },
        callback
      )
    } else {
      // Build Defaults
      callDynamicSass(
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
