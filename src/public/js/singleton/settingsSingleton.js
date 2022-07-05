const _ = require('lodash')
const axios = require('axios').default

const SettingsService = {}
let settings = null

let loaded = false
SettingsService.getLoaded = () => loaded

SettingsService.init = callback => {
  if (window.trudeskSettingsService.getLoaded() === true) return

  if (settings === null || _.isUndefined(settings)) {
    SettingsService.refresh(() => {
      loaded = true
      if (typeof callback === 'function') return callback()
    })
  }
}

SettingsService.getSettings = () => settings

SettingsService.refresh = callback => {
  axios
    .get('/api/v1/settings')
    .then(res => {
      settings = res.data.settings.data.settings

      if (typeof callback === 'function') return callback()
    })
    .catch(err => {
      console.error(err)
    })
}

if (_.isUndefined(window.trudeskSettingsService) || window.trudeskSettingsService === null)
  window.trudeskSettingsService = SettingsService

module.exports = SettingsService
