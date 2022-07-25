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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import async from 'async'
import _ from 'lodash'
import winston from '../../logger'
import moment from 'moment'
import {
  ConversationModel,
  DepartmentModel,
  GroupModel,
  MessageModel,
  NoticeModel,
  NotificationModel,
  PriorityModel,
  SettingModel,
  SettingModel as settingSchema,
  TeamModel,
  TicketTagsModel,
  TicketTypeModel,
  UserModel
} from '../../models'
import settingsUtil from '../../settings/settingsUtil'
import buildSass from '../../sass/buildsass'
import packageJson from '../../../package.json'
import permissions from '../../permissions'
import { trudeskRoot } from '../../config'

const viewController = {}
const viewdata = {}
viewdata.users = {}

viewController.getData = function (request, cb) {
  async.parallel(
    [
      function (callback) {
        if (global.env === 'development') {
          buildSass.build(callback)
        } else {
          return callback()
        }
      },
      function (callback) {
        viewdata.version = packageJson.version
        return callback()
      },
      function (callback) {
        async.parallel(
          [
            function (done) {
              settingSchema.getSettingByName('gen:timeFormat', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.timeFormat = setting.value
                } else {
                  viewdata.timeFormat = 'hh:mma'
                }

                return done()
              })
            },
            function (done) {
              settingSchema.getSettingByName('gen:shortDateFormat', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.shortDateFormat = setting.value
                } else {
                  viewdata.shortDateFormat = 'MM/DD/YYYY'
                }

                return done()
              })
            },
            function (done) {
              settingSchema.getSettingByName('gen:longDateFormat', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.longDateFormat = setting.value
                } else {
                  viewdata.longDateFormat = 'MMM DD, YYYY'
                }

                return done()
              })
            }
          ],
          callback
        )
      },
      function (callback) {
        viewdata.ticketSettings = {}
        async.parallel(
          [
            function (done) {
              settingSchema.getSettingByName('playNewTicketSound:enable', function (err, setting) {
                if (!err && setting && !_.isUndefined(setting.value)) {
                  viewdata.ticketSettings.playNewTicketSound = setting.value
                } else {
                  viewdata.ticketSettings.playNewTicketSound = true
                }
              })

              return done()
            },
            function (done) {
              settingSchema.getSettingByName('ticket:minlength:subject', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.ticketSettings.minSubject = setting.value
                } else {
                  viewdata.ticketSettings.minSubject = 10
                }

                return done()
              })
            },
            function (done) {
              settingSchema.getSettingByName('ticket:minlength:issue', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.ticketSettings.minIssue = setting.value
                } else {
                  viewdata.ticketSettings.minIssue = 10
                }

                return done()
              })
            },
            function (done) {
              settingSchema.getSettingByName('allowAgentUserTickets:enable', function (err, setting) {
                if (!err && setting && setting.value) {
                  viewdata.ticketSettings.allowAgentUserTickets = setting.value
                } else {
                  viewdata.ticketSettings.allowAgentUserTickets = false
                }

                return done()
              })
            }
          ],
          callback
        )
      },
      function (callback) {
        settingSchema.getSettingByName('gen:sitetitle', function (err, setting) {
          if (!err && setting && setting.value) {
            viewdata.siteTitle = setting.value
          } else {
            viewdata.siteTitle = 'Trudesk'
          }

          return callback()
        })
      },
      function (callback) {
        viewdata.hostname = request.hostname
        viewdata.hosturl = request.protocol + '://' + request.get('host')

        // If hosturl setting is not set. Let's set it.
        settingSchema.getSettingByName('gen:siteurl', function (err, setting) {
          if (!err && !setting) {
            settingSchema.create(
              {
                name: 'gen:siteurl',
                value: viewdata.hosturl
              },
              function (err, setting) {
                if (err) return callback()
                if (!global.TRUDESK_BASEURL) global.TRUDESK_BASEURL = setting.value

                return callback()
              }
            )
          } else {
            return callback()
          }
        })
      },
      function (callback) {
        settingSchema.getSettingByName('gen:timezone', function (err, timezone) {
          if (!err && timezone) {
            viewdata.timezone = timezone.value
          } else {
            viewdata.timezone = 'America/New_York'
          }

          return callback()
        })
      },
      function (callback) {
        settingSchema.getSettingByName('gen:customlogo', function (err, hasCustomLogo) {
          viewdata.hasCustomLogo = !!(!err && hasCustomLogo && hasCustomLogo.value)

          if (!viewdata.hasCustomLogo) {
            viewdata.logoImage = '/img/defaultLogoLight.png'
            return callback()
          }

          settingSchema.getSettingByName('gen:customlogofilename', function (err, logoFileName) {
            if (!err && logoFileName && !_.isUndefined(logoFileName.value)) {
              viewdata.logoImage = '/assets/' + logoFileName.value
            } else {
              viewdata.logoImage = '/img/defaultLogoLight.png'
            }

            return callback()
          })
        })
      },
      function (callback) {
        settingSchema.getSettingByName('gen:custompagelogo', function (err, hasCustomPageLogo) {
          viewdata.hasCustomPageLogo = !!(!err && hasCustomPageLogo && hasCustomPageLogo.value)

          if (!viewdata.hasCustomPageLogo) {
            viewdata.pageLogoImage = '/img/defaultLogoDark.png'
            return callback()
          }

          settingSchema.getSettingByName('gen:custompagelogofilename', function (err, logoFileName) {
            if (!err && logoFileName && !_.isUndefined(logoFileName.value)) {
              viewdata.pageLogoImage = '/assets/' + logoFileName.value
            } else {
              viewdata.pageLogoImage = '/img/defaultLogoDark.png'
            }

            return callback()
          })
        })
      },
      async function (callback) {
        try {
          const hasCustomFavicon = await settingSchema.getSettingByName('gen:customfavicon')
          viewdata.hasCustomFavicon = hasCustomFavicon && hasCustomFavicon.value === false
          if (!viewdata.hasCustomFavicon) {
            viewdata.favicon = '/img/favicon.ico'
            return callback()
          }

          const faviconFilename = await settingSchema.getSettingByName('gen:customfaviconfilename')
          if (faviconFilename && faviconFilename.value)
            viewdata.favicon = `/assets/${faviconFilename.value}`
          else
            viewdata.favicon = '/img/favicon.ico'

          return callback()
        } catch (e) {
          viewdata.favicon = '/img/favicon.ico'
          return callback()
        }
      },
      function (callback) {
        viewController.getActiveNotice(function (err, data) {
          if (err) return callback(err)
          viewdata.notice = data
          viewdata.noticeCookieName = undefined

          if (!_.isUndefined(data) && !_.isNull(data)) {
            viewdata.noticeCookieName = data.name + '_' + moment(data.activeDate).format('MMMDDYYYY_HHmmss')
          }

          return callback()
        })
      },
      // function (callback) {
      //   viewController.getUserNotifications(request, function (err, data) {
      //     if (err) return callback(err)
      //
      //     viewdata.notifications.items = data
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getUnreadNotificationsCount(request, function (err, count) {
      //     if (err) return callback(err)
      //     viewdata.notifications.unreadCount = count
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getConversations(request, function (err, conversations) {
      //     if (err) return callback(err)
      //
      //     viewdata.conversations = conversations
      //
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getUsers(request, function (users) {
      //     viewdata.users = users
      //
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.loggedInAccount(request, function (data) {
      //     viewdata.loggedInAccount = data
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getTeams(request, function (err, teams) {
      //     if (err) return callback(null, null)
      //
      //     viewdata.teams = teams
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getGroups(request, function (err, data) {
      //     if (err) return callback(null, null)
      //
      //     viewdata.groups = data
      //
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getTypes(request, function (err, data) {
      //     if (err) return callback()
      //
      //     viewdata.ticketTypes = data
      //
      //     return callback()
      //   })
      // },
      function (callback) {
        viewController.getDefaultTicketType(request, function (err, data) {
          if (err) return callback()

          viewdata.defaultTicketType = data

          return callback()
        })
      },
      // function (callback) {
      //   viewController.getPriorities(request, function (err, data) {
      //     if (err) return callback()
      //
      //     viewdata.priorities = data
      //
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   viewController.getTags(request, function (err, data) {
      //     if (err) return callback()
      //
      //     viewdata.ticketTags = data
      //
      //     return callback()
      //   })
      // },
      // function (callback) {
      //   const roleSchmea = require('../../models/role')
      //   const roleOrder = require('../../models/roleorder')
      //   roleSchmea.getRoles(function (err, roles) {
      //     if (err) return callback(err)
      //
      //     roleOrder.getOrder(function (err, ro) {
      //       if (err) return callback(err)
      //
      //       viewdata.roles = roles
      //       viewdata.roleOrder = ro
      //
      //       return callback()
      //     })
      //   })
      // },
      function (callback) {
        viewController.getShowTourSetting(request, function (err, data) {
          if (err) return callback(err)

          viewdata.showTour = data

          return callback()
        })
      },
      function (callback) {
        viewController.getOverdueSetting(request, function (err, data) {
          if (err) return callback(err)

          viewdata.showOverdue = data

          return callback()
        })
      },
      function (callback) {
        settingsUtil.getSettings(function (err, res) {
          if (err) return callback(err)

          viewdata.hasThirdParty = res.settings.hasThirdParty

          return callback()
        })
      },
      function (callback) {
        settingsUtil.getSettings(function (err, res) {
          if (err) return callback(err)

          viewdata.accountsPasswordComplexity = res.settings.accountsPasswordComplexity.value

          return callback()
        })
      },
      function (callback) {
        viewController.getPluginsInfo(request, function (err, data) {
          if (err) return callback(err)

          viewdata.plugins = data

          return callback()
        })
      }
    ],
    function (err) {
      if (err) {
        winston.warn('Error: ' + err)
      }

      return cb(viewdata)
    }
  )
}

viewController.getActiveNotice = function (callback) {
  NoticeModel.getActive(function (err, notice) {
    if (err) {
      winston.warn(err.message)
      return callback(err)
    }

    return callback(null, notice)
  })
}

viewController.getUserNotifications = function (request, callback) {
  NotificationModel.findAllForUser(request.user._id, function (err, data) {
    if (err) {
      winston.warn(err.message)
      return callback(err)
    }

    return callback(null, data)
  })
}

viewController.getUnreadNotificationsCount = function (request, callback) {
  NotificationModel.getUnreadCount(request.user._id, function (err, count) {
    if (err) {
      winston.warn(err.message)
      return callback(err)
    }

    return callback(null, count)
  })
}

viewController.getConversations = function (request, callback) {
  ConversationModel.getConversationsWithLimit(request.user._id, 10, function (err, conversations) {
    if (err) {
      winston.warn(err.message)
      return callback(err)
    }

    const convos = []

    async.eachSeries(
      conversations,
      function (convo, done) {
        const c = convo.toObject()

        const userMeta =
          convo.userMeta[
            _.findIndex(convo.userMeta, function (item) {
              return item.userId.toString() === request.user._id.toString()
            })
            ]
        if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) {
          return done()
        }

        MessageModel.getMostRecentMessage(c._id, function (err, rm) {
          if (err) return done(err)

          _.each(c.participants, function (p) {
            if (p._id.toString() !== request.user._id.toString()) {
              c.partner = p
            }
          })

          rm = _.first(rm)

          if (!_.isUndefined(rm)) {
            if (String(c.partner._id) === String(rm.owner._id)) {
              c.recentMessage = c.partner.fullname + ': ' + rm.body
            } else {
              c.recentMessage = 'You: ' + rm.body
            }
          } else {
            c.recentMessage = 'New Conversation'
          }

          convos.push(c)

          return done()
        })
      },
      function (err) {
        return callback(err, convos)
      }
    )
  })
}

viewController.getUsers = async (request, callback) => {
  if (request.user.role.isAdmin || request.user.role.isAgent) {
    try {
      const users = await UserModel.find({})
      if (!users) throw new Error('Unable to find any users...')

      let u = _.reject(users, function (u) {
        return u.deleted === true
      })
      u.password = null
      u.role = null
      u.resetPassHash = null
      u.resetPassExpire = null
      u.accessToken = null
      u.iOSDeviceTokens = null
      u.preferences = null
      u.tOTPKey = null

      u = _.sortBy(u, 'fullname')

      return callback(u)
    } catch (e) {
      winston.warn(e)
      if (typeof callback === 'function') return callback(e)
    }
  } else {
    GroupModel.getAllGroupsOfUser(request.user._id, function (err, groups) {
      if (err) return callback(err)

      let users = _.map(groups, function (g) {
        return _.map(g.members, function (m) {
          const mFiltered = m
          m.password = null
          m.role = null
          m.resetPassHash = null
          m.resetPassExpire = null
          m.accessToken = null
          m.iOSDeviceTokens = null
          m.preferences = null
          m.tOTPKey = null

          return mFiltered
        })
      })

      users = _.chain(users)
        .flattenDeep()
        .uniqBy(function (i) {
          return i._id
        })
        .sortBy('fullname')
        .value()

      return callback(users)
    })
  }
}

viewController.loggedInAccount = async function (request, callback) {
  try {
    const user = await UserModel.getUser(request.user._id)

    return callback(null, user)
  } catch (e) {
    winston.warn(e)
    return callback(e)
  }
}

viewController.getTeams = function (request, callback) {
  return TeamModel.getTeams(callback)
}

viewController.getGroups = function (request, callback) {
  if (request.user.role.isAdmin || request.user.role.isAgent) {
    DepartmentModel.getDepartmentGroupsOfUser(request.user._id, function (err, groups) {
      if (err) {
        winston.debug(err)
        return callback(err)
      }

      return callback(null, groups)
    })
  } else {
    GroupModel.getAllGroupsOfUserNoPopulate(request.user._id, function (err, data) {
      if (err) {
        winston.debug(err)
        return callback(err)
      }

      if (permissions.canThis(request.user.role, 'ticket:public')) {
        GroupModel.getAllPublicGroups(function (err, groups) {
          if (err) {
            winston.debug(err)
            return callback(err)
          }

          data = data.concat(groups)
          return callback(null, data)
        })
      } else {
        return callback(null, data)
      }
    })
  }
}

viewController.getTypes = function (request, callback) {
  TicketTypeModel.getTypes(function (err, data) {
    if (err) {
      winston.debug(err)
      return callback(err)
    }

    return callback(null, data)
  })
}

viewController.getDefaultTicketType = function (request, callback) {
  SettingModel.getSettingByName('ticket:type:default', function (err, defaultType) {
    if (err) {
      winston.debug('Error viewController:getDefaultTicketType: ', err)
      return callback(err)
    }

    TicketTypeModel.getType(defaultType.value, function (err, type) {
      if (err) {
        winston.debug('Error viewController:getDefaultTicketType: ', err)
        return callback(err)
      }

      return callback(null, type)
    })
  })
}

viewController.getPriorities = function (request, callback) {
  PriorityModel.getPriorities(function (err, priorities) {
    if (err) {
      winston.debug('Error viewController:getPriorities: ' + err)
      return callback(err)
    }

    priorities = _.sortBy(priorities, ['migrationNum', 'name'])

    return callback(null, priorities)
  })
}

viewController.getTags = function (request, callback) {
  TicketTagsModel.getTags(function (err, data) {
    if (err) {
      winston.debug(err)
      return callback(err)
    }

    // data = _.sortBy(data, 'name');

    return callback(null, data)
  })
}

viewController.getOverdueSetting = function (request, callback) {
  SettingModel.getSettingByName('showOverdueTickets:enable', function (err, data) {
    if (err) {
      winston.debug(err)
      return callback(null, true)
    }
    if (_.isNull(data)) return callback(null, true)
    return callback(null, data.value)
  })
}

viewController.getShowTourSetting = async function (request, callback) {
  if (!request.user) return callback('Invalid User')

  try {
    SettingModel.getSettingByName('showTour:enable', async function (err, data) {
      if (err) {
        winston.debug(err)
        return callback(null, true)
      }

      if (!_.isNull(data) && !_.isUndefined(data) && data === false) {
        return callback(null, true)
      }

      const user = await UserModel.getUser(request.user._id)

      let hasTourCompleted = false

      if (user.preferences.tourCompleted) {
        hasTourCompleted = user.preferences.tourCompleted
      }

      if (hasTourCompleted) return callback(null, false)

      if (_.isNull(data)) return callback(null, true)

      return callback(null, data.value)
    })
  } catch (e) {
    winston.warn(e)
    return callback(e)
  }
}

viewController.getPluginsInfo = function (request, callback) {
  // Load Plugin routes
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dive = require('dive')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')
  const pluginDir = path.resolve(trudeskRoot(), 'plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
  const plugins = []
  dive(
    pluginDir,
    { directories: true, files: false, recursive: false },
    function (err, dir) {
      if (err) throw err
      delete require.cache[require.resolve(path.join(dir, '/plugin.json'))]
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pluginPackage = require(path.join(dir, '/plugin.json'))
      plugins.push(pluginPackage)
    },
    function () {
      return callback(null, _.sortBy(plugins, 'name'))
    }
  )
}

module.exports = viewController

export default viewController
