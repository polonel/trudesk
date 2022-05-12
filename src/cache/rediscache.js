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

const _ = require('lodash')
const redis = require('redis')
const winston = require('winston')

// const REDIS_PORT = process.env.REDIS_PORT || 6379;
// const REDIS_HOST = process.env.REDIS_HOST || 'localhost';

const client = redis.createClient(32819, '127.0.0.1')

client.on('error', function (err) {
  winston.warn(err)
})

const redisCache = {}

redisCache.setCache = function (key, value, callback, ttl) {
  if (!_.isArray(value)) {
    value = [value]
  }
  if (!_.isUndefined(ttl)) {
    const importMulti = client.multi()
    const v = JSON.stringify(value)
    importMulti.hmset(rake('$trudesk', key), { data: v })
    importMulti.expire(rake('$trudesk', key), 600)

    // value.forEach(function(item) {
    //     const v = JSON.stringify(item);
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
