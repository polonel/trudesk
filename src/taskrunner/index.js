/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
*/

import pkg from '../../package.json'
import logger from '../logger'
import { Octokit } from '@octokit/core'
import semver from 'semver'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { setReleases } from '../memory/releases_inmemory'

const taskRunner = {}
const octokit = new Octokit()
dayjs.extend(relativeTime, {
  thresholds: [{ l: 'dd', r: 90000, d: 'day' }]
})

taskRunner.init = async function (callback) {
  // taskRunner.sendStats(function (err) {
  //   if (!err) setInterval(taskRunner.sendStats, 86400000) // 24 hours
  // })

  try {
    await taskRunner.checkForUpdates()
    setInterval(taskRunner.checkForUpdates, 86400000)

    await taskRunner.getReleases()
    setInterval(taskRunner.getReleases, 86400000)
  } catch (err) {
    /* empty */
  }

  return callback()
}

taskRunner.getReleases = async () => {
  try {
    const response = await octokit.request('GET /repos/polonel/trudesk/releases')
    for (let release of response.data) {
      release.duration_format = dayjs(release.published_at).fromNow()
    }
    if (response.data) setReleases(response.data)
  } catch (err) {
    logger.warn(err)
    throw err
  }
}

taskRunner.checkForUpdates = async () => {
  try {
    const response = await octokit.request('GET /repos/polonel/trudesk/releases/latest')
    if (response.data) {
      const tagName = response.data.tag_name
      if (tagName) {
        const latestVersion = semver.parse(tagName)
        const currentVersion = semver.parse(pkg.version)
        // logger.debug('Current version: v' + currentVersion.version)
        // logger.debug('Latest Version: v' + latestVersion.version)
        if (latestVersion > currentVersion)
          logger.info('!!! New version available: v' + latestVersion.version + '  !!!')
      }
    }
  } catch (err) {
    logger.warn(err)
    throw err
  }
}

// taskRunner.sendStats = function (callback) {
//   settingSchema.getSettingsByName(['gen:installid', 'gen:version', 'gen:siteurl'], function (err, settings) {
//     if (err) return callback(err)
//     if (!settings || settings.length < 1) return callback()
//
//     let versionSetting = _.find(settings, function (x) {
//       return x.name === 'gen:version'
//     })
//     const installIdSetting = _.find(settings, function (x) {
//       return x.name === 'gen:installid'
//     })
//
//     let hostnameSetting = _.find(settings, function (x) {
//       return x.name === 'gen:siteurl'
//     })
//
//     if (!installIdSetting) return callback()
//
//     versionSetting = _.isUndefined(versionSetting) ? { value: '--' } : versionSetting
//
//     hostnameSetting = _.isUndefined(hostnameSetting) ? { value: '--' } : hostnameSetting
//
//     const result = {
//       ticketCount: 0,
//       agentCount: 0,
//       customerGroupCount: 0,
//       conversationCount: 0
//     }
//
//     async.parallel(
//       [
//         function (done) {
//           ticketSchema.countDocuments({ deleted: false }, function (err, count) {
//             if (err) return done(err)
//
//             result.ticketCount = count
//             return done()
//           })
//         },
//         function (done) {
//           userSchema.getAgents({}, function (err, agents) {
//             if (err) return done(err)
//
//             if (!agents) return done()
//             result.agentCount = agents.length
//
//             return done()
//           })
//         },
//         function (done) {
//           groupSchema.countDocuments({}, function (err, count) {
//             if (err) return done(err)
//
//             result.customerGroupCount = count
//
//             return done()
//           })
//         },
//         function (done) {
//           conversationSchema.countDocuments({}, function (err, count) {
//             if (err) return done(err)
//
//             result.conversationCount = count
//
//             return done()
//           })
//         }
//       ],
//       function (err) {
//         // if (typeof callback === 'function') return callback()
//         // return
//         if (err) return callback()
//         request(
//           'https://stats.trudesk.app/api/v1/installation',
//           {
//             method: 'POST',
//             json: true,
//             body: {
//               statsKey: 'trudesk',
//               id: installIdSetting.value,
//               version: versionSetting.value,
//               hostname: hostnameSetting.value,
//               ticketCount: result.ticketCount,
//               agentCount: result.agentCount,
//               customerGroupCount: result.customerGroupCount,
//               conversationCount: result.conversationCount
//             }
//           },
//           callback
//         )
//       }
//     )
//   })
// }

export default taskRunner
