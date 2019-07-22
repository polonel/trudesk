var _ = require('lodash'),
  path = require('path'),
  nconf = require('nconf'),
  i18next = require('i18next'),
  i18nextMiddleware = require('i18next-express-middleware'),
  i18nextBackend = require('i18next-node-fs-backend')

var obj = {}
obj.register = function (app, handlebars) {
  i18next
    .use(i18nextBackend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
      },
      // lng: 'en_US',
      // lng: 'de',
      lng: nconf.get('locale') ? nconf.get('locale') : 'dev',
      preload: ['en', 'de'],
      ns: ['install', 'account', 'ticket', 'group', 'messages', 'settings', 'client', 'common', 'error'],
      defaultNS: 'client',
      missingKeyHandler: function (lng, ns, key, fallbackValue) {
        var fs = require('fs')
        var lngFile = path.join(__dirname, '../../locales/' + lng + '/' + ns + '.json')
        var obj = JSON.parse(fs.readFileSync(lngFile))
        var kObj = {}
        kObj[key] = fallbackValue
        var k = _.extend(obj, kObj)
        fs.writeFileSync(lngFile, JSON.stringify(k, null, 2))
      },
      saveMissing: true
    })

  app.use(i18nextMiddleware.handle(i18next))

  // i18n
  global.i18next = i18next
  handlebars.registerHelper('__', function (key, options) {
    return new handlebars.SafeString(i18next.t(key, options.hash))
  })

  /*handlebars.registerHelper('t', function(str){
    return (I18n != undefined ? I18n.t(str) : str);
  })*/
}

module.exports = obj
