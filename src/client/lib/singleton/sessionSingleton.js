const _ = require('lodash')
const async = require('async')
const axios = require('axios').default

const SessionService = {}
let instance = null

let sessionUser = null
let groups = null
let roles = null
let roleOrder = null

SessionService.init = (callback, force) => {
  if (instance && !force) {
    if (typeof callback === 'function') return callback(null, instance)

    return
  }

  if (force) {
    instance = null
    sessionUser = null
    groups = null
    roles = null
    roleOrder = null
  }

  async.series(
    {
      user: done => {
        if (sessionUser === null) {
          axios
            .get('/api/v1/login')
            .then(res => {
              sessionUser = res.data.user

              return done(null, sessionUser)
            })
            .catch(err => {
              return done(err)
            })
        } else return done()
      },
      groups: done => {
        if (groups !== null) return done()

        axios
          .get('/api/v1/users/' + sessionUser.username + '/groups')
          .then(res => {
            groups = res.data.groups
            sessionUser.groups = groups

            return done(null, groups)
          })
          .catch(err => {
            return done(err)
          })
      },
      roles: done => {
        if (roles !== null) return done()

        axios
          .get('/api/v1/roles')
          .then(res => {
            roles = res.data.roles
            roleOrder = res.data.roleOrder

            return done(null, roles)
          })
          .catch(err => {
            return done(err)
          })
      }
    },
    (err, obj) => {
      if (err) console.error(err)

      instance = obj

      if (typeof callback === 'function') return callback(err, obj)
    }
  )
}

SessionService.flushRoles = callback => {
  axios
    .get('/api/v1/roles')
    .then(res => {
      roles = res.data.roles
      roleOrder = res.data.roleOrder

      if (typeof callback === 'function') return callback(null, roles)
    })
    .catch(err => {
      console.error(err)
      if (typeof callback === 'function') return callback(err)
    })
}

SessionService.getUser = () => sessionUser
SessionService.getRoles = () => roles
SessionService.getRoleOrder = () => roleOrder
SessionService.getInstance = () => instance
SessionService.forceUpdate = callback => {
  SessionService.init(callback, true)
}

if (_.isUndefined(window.trudeskSessionService) || window.trudeskSessionService === null)
  window.trudeskSessionService = SessionService

module.exports = SessionService
