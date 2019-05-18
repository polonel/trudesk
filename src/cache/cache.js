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
 *  Updated:    5/17/19 2:03 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var NodeCache = require('node-cache')
var path = require('path')
var cache = {}

cache.init = function () {
  global.cache = new NodeCache({ checkperiod: 0 })
  cache.memLimit = process.env.CACHE_MEMLIMIT || '2048'
  var env = { FORK: 1, NODE_ENV: global.env, TIMEZONE: global.timezone }
  cache.env = _.merge(cache.env, env)

  spawnCache()
  setInterval(spawnCache, 55 * 60 * 1000)
}

function spawnCache () {
  var fork = require('child_process').fork

  var n = fork(path.join(__dirname, './index.js'), {
    execArgv: ['--max-old-space-size=' + cache.memLimit],
    env: cache.env
  })

  global.forks.push({ name: 'cache', fork: n })

  n.on('message', function (data) {
    if (data.cache) {
      global.cache.data = data.cache.data
    }
  })

  n.on('close', function () {
    _.remove(global.forks, function (i) {
      return i.name === 'cache'
    })
  })
}

module.exports = cache
