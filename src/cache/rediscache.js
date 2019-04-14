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
var redis = require('redis')
var winston = require('winston')

// var REDIS_PORT = process.env.REDIS_PORT || 6379;
// var REDIS_HOST = process.env.REDIS_HOST || 'localhost';

var client = redis.createClient(32819, '24.142.200.107')

client.on('error', function (err) {
  winston.warn(err)
})

var redisCache = {}

redisCache.setCache = function (key, value, callback, ttl) {
  if (!_.isArray(value)) {
    value = [value]
  }
  if (!_.isUndefined(ttl)) {
    var importMulti = client.multi()
    var v = JSON.stringify(value)
    importMulti.hmset(rake('$trudesk', key), { data: v })
    importMulti.expire(rake('$trudesk', key), 600)

    // value.forEach(function(item) {
    //     var v = JSON.stringify(item);
    //     importMulti.hmset(rake('$trudesk', key), {_id: item._id.toString(), data: v});
    //     importMulti.expire(rake('$trudesk', key), 600);
    // });

    importMulti.exec(function (err) {
      if (err) return callback(err)

      client.quit()

      return callback()
    })
  } else {
    return client.set(key, value)
  }
}

redisCache.getCache = function (key, callback) {
  return client.hgetall(key, callback)
}

function rake () {
  return Array.prototype.slice.call(arguments).join(':')
}

module.exports = redisCache
