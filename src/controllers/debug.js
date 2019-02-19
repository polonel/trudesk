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
var async = require('async')
var path = require('path')
var winston = require('winston')

var debugController = {}

debugController.content = {}

debugController.populatedatabase = function (req, res) {
  var Chance = require('chance')
  var chance = new Chance()
  var ticketSchema = require('../models/ticket')
  var ticketTypeSchema = require('../models/tickettype')
  var userSchema = require('../models/user')
  var groupSchema = require('../models/group')
  var tagSchema = require('../models/tag')

  var ticketsToSave = []
  var users = []

  var subjects = [
    '911 Cad Updates',
    '911 Copier',
    '911 Handset',
    '911 Managers PC',
    '911 Network Diagram',
    '911 Phone 10MB Issue',
    '911 Recording Player',
    '911 Weather monitor PC blue Screen ',
    'AC Admin Office Internet Out',
    'AC Computers',
    'AC Unifi wireless not secured',
    'Access',
    'Access to M-Files',
    'Access to Printer',
    'Access to Scanner Files ',
    'Accessing email from my laptop remotely',
    'Activate MiFis',
    'Active X for MagTek Site',
    'Adapter for dual monitors',
    'Add Adobe to computers',
    'Add Email Account',
    'Additional PC',
    'Admin Office Computer Outlook',
    'Adobe Application on PC',
    'Adobe Converter',
    'Adobe Professional',
    'Adult Services Computer',
    'AFIS Machine',
    'Air Conditioner - Server Room ',
    'Alarm going off',
    'Amanda needs access to Logics',
    'Amanda opened email attachment',
    'Back up drive replacement for Unity PC',
    'Backup Failure',
    'Bandwidth Assessment',
    'Battery Backup',
    'Booking desk camera taking photos upside down ',
    'Booking Desk Computer Running Slow',
    'BPS Distribution List',
    'BPS Security Camera System',
    'BPS-RMS Server Migration',
    'Broken Printer',
    'Cable for TV',
    'CAD 1 monitor flickering',
    'CAD 1 monitor out',
    'CAD 1 problem',
    'CAD 1 Screens',
    'CAD 2 cut off (over heated)',
    'CAD 2 Monitor not working',
    'CAD 2 Mouse not working',
    'CAD 2 no display on top left monitor',
    'CAD 2 problem',
    'CAD 3 Screen flickering',
    'CAD 3 top left monitor half black half green',
    'CAD 4 screen display',
    'CAD 4 VPN not connecting ',
    'CAD 1 Printer',
    'CAD 1 Monitor',
    'CAD 2 911',
    'CAD 2 radio PC unable to log in ',
    'Calendars Syncing-Microsoft Outlook',
    'Camera system issue',
    'Cameras For Thorton Library',
    'Cannot log into DCI',
    'Cannot Log into M-Files',
    'Cannot open files using Office Suite',
    'Cant burn files to disc',
    "Can't get into the network shared drive",
    "Can't open link",
    'Cassidian Alarm',
    'CEI - Needs IT Assistance ',
    'Cell Phone Issue',
    "Chairman's Microphone @ Expo",
    'Change in Email Address',
    'Change paper print size',
    'Check Scanning',
    'Checking for a missing email from DOJ',
    'Checks PC',
    'Chief CAD program not working.',
    'Chief Sheriff Pak reload',
    'Chief unable to scan from Office HP AIO',
    'Child Support Access Point',
    'Child Support Cannot Prin',
    'Child Support Computer',
    'Child Support laptop order',
    'Child Support Mainframe printer not working',
    'Child Support Remote Printing',
    'Child Support Scanner & K drive',
    'Child Support Spare Computer',
    'Chrome install',
    'Circ Chrome Java Issue',
    'Circ Desk (SAM)',
    'Circ Desk Computer',
    'Circ Desk PC',
    'Circ Desk Printer',
    "Circ Staff PC's",
    'Circ station cannot print from SAM',
    'Circulation desk PC no internet (email)',
    'Circulation PC upgraded to Windows 10 ',
    'Citrix Not Working Properly',
    'Clean up Robins old PC',
    'Clerk of Court',
    'Colin Creech New Deputy',
    'Communications Computer error',
    'Comodo Startup Error',
    'Computer monitor ',
    'Computer Monitor Gray',
    'Computer not communicating with HP printer',
    'Computer not connecting',
    'Computer order for Landfill',
    'Computer Order for Senior Center',
    'Computer problem',
    'Computer replacement at Thornton Library',
    'Computer slower after new printer installed',
    'Computer Virus Senior Center',
    'Computers at South Branch Library',
    'Computers not communicating with HP Scanner',
    'Computers running slow and freezing up',
    'Conference Room Phone',
    'Connect tablet to WiFi',
    'Convert BOE XPS email attachments to PDF',
    'Convert Security Videos',
    'Convert Surveillance Videos',
    'Cooperative Extensions Meeting Room Projector',
    'Copiers that need to be networked',
    'Core Fiber Outage',
    "Couldn't Connect to GoTo Meeting",
    'County Email',
    'County Staff meeting',
    'County Website',
    'Courthouse Cameras',
    "Courthouse CCTV's not online",
    'Courthouse PC installed Windows 10',
    'Courthouse Security Computer',
    'Courthouse Security PC',
    'Courthouse Security Virus',
    'Courthouse Sheriff-Pak',
    'CPU Error Message',
    'Deactivate Email Account',
    'Deep Freeze',
    'Delete Email Account',
    'Department Scanner/Copier Install',
    'Deputy PC Windows 10 Error on boot',
    "Director's Outlook",
    'Disc drive not showing up on laptop',
    'Disconnect and Remove ID Badge Printer',
    "Dispatch can't get into DCI",
    'Domain Trust Error',
    'Door PC crashed',
    'Door Schedule',
    'Door System',
    'Drone iPads',
    'Dropped Phone Calls',
    'Dual Monitor Install',
    'East Oxford Polling Site',
    'Economic Development - No Internet',
    'Epson PowerLite 1705c Projector',
    'Epson Printer',
    'Equipment Move to Wilton',
    'Error 500 message',
    'Error Message',
    'Error Message on PC',
    'Error message saving scan to email',
    'Error message when opening Outlook',
    'Error on HP 9050n printer',
    'Evergreen',
    'Evergreen SSL Expired',
    'Excel',
    'Excel Spreadsheet wont open',
    'Exchange Email Account',
    'Exchange Server',
    'Exchange Server Cert Renewal',
    'Exchange Server Certificate',
    'Exchange Server Move Database',
    'Exchange Server will not process messages',
    'Express Kiosk PC',
    'Express Library',
    'Extender installed at Hilltop Senior',
    'File Permissions',
    'File Restore',
    'GIS website',
    'Global Address Book',
    'Google Calendar',
    'Hook up Scanner',
    'Host on Demand not launching Java',
    'HP Scanner ',
    'HP ThinkClitent',
    'ID Badge System- Card 5',
    'Import favorites from IE to Chrome',
    'Incorrect Time Showing in trudesk',
    'Increase email file size',
    'Inernet Connection is down in Animal Shelter.',
    'Infected PC',
    'Information needed',
    'Ingenico Credit Card Machine Ethernet Issue',
    'Internet Connectivity',
    'Inventory of Election Equipment for One-Stop sites',
    'Jail Admin',
    'Jail admin VPN not working ',
    'Jail Administration Slow Computers',
    'Jail Booking Desk',
    'Jail Control Room',
    'Jail control room lock PC',
    'Jail Rounds Computer',
    'Junk Mail ',
    'Keyboard Issue',
    'LCD Projector',
    'Library email accounts needed',
    'Library Shared Drive',
    'Library staff training',
    'Library System Email',
    'Linear eMerge Security System',
    'Make a copy of CD ',
    'Malware',
    'Microsoft Office',
    'Microsoft Office 2013',
    'Microsoft Office Calendars-Need Syncing',
    "Microsoft Office Patron PC's",
    'Mifi device not working',
    'Move RPM to new Windows 2012 Server',
    'Network New Copier',
    'Network Printer not printing',
    'Network/Server Failure',
    'No Internet Main Senior Center',
    'Office Computer',
    'Office Printers',
    'Office Suite Activation',
    'Office update not working',
    'Omnixx CAD 4',
    'Online Calculator',
    'Online Tax Bills',
    'PC Quote needed',
    'PC Screen Pink ',
    'Possible Virus',
    'Post warning message on PC in the paternity office',
    'Potential Virus Activity - HELP_DECRYPT',
    'Power Point for SO Community Watch',
    'Power problem with Unity computer and printer',
    'Print Master install',
    'Profile Log in error - Child Support computer',
    'SAM not opening on PC 15',
    'SAM not refreshing',
    'SAM not working',
    'SAM not working properly',
    'SAM Sign-up Station',
    'SAM Sign-up station',
    'SAM staff computer',
    'SAM-PC Activity Manager is not working',
    'Security',
    'Security Alert',
    'Security Certificate for Outlook ',
    'Shared Folder',
    'Transportation Database',
    'Transportation Log',
    'Uanble to log into logics',
    "Unable to access M-Files from Mike's computer",
    'Unable to connect to SOBK WiFi',
    'Unable to open Scanner Files',
    'Unable to pictures ',
    'Unable to receive Emails',
    'Unalbe to access WebLogics',
    'Unexpected computer shutdown',
    'Unity Computer Upgrade',
    'Unsolicited Bulk Email',
    'Update aerial view for maps',
    'Updated CAD software from v12 to v13',
    'UPS for State Server will not remain powered up',
    'UPS issue for SBOE Server',
    'UPS not working after brown out',
    'UPS problem at Unity System/Password problem with Trudesk',
    'WiFi adapter replacement',
    'Windows PC Internet',
    'Windows Recovery Error on PC',
    'Windows System Error immediately after signing onto desktop',
    'Windows Update',
    'Windows Update Failure during system startup',
    'Windows updates taking 30 to 45 minutes each morning to revert'
  ]

  async.series(
    [
      function (done) {
        var roles = global.roles
        var userRole = _.find(roles, { normalized: 'user' })

        users = []
        for (var i = 0; i < 11; i++) {
          var random = Math.floor(Math.random() * (10000 - 1 + 1)) + 1
          var first = chance.first()
          var last = chance.last()
          var user = {
            username: first + '.' + last,
            fullname: first + ' ' + last,
            email: first + '.' + last + random + '@' + chance.domain(),
            title: chance.profession(),
            password: 'password',
            role: userRole._id
          }

          users.push(user)
        }

        userSchema.collection.insert(users, done)
      },
      function (done) {
        groupSchema.remove({}, done)
      },
      function (done) {
        tagSchema.remove({}, done)
      },
      function (done) {
        ticketSchema.remove({}, done)
      },
      function (done) {
        var groups = []
        for (var i = 0; i < 11; i++) {
          var name = chance.company()
          while (_.find(groups, { name: name })) {
            name = chance.company()
          }

          var group = {
            name: name,
            __v: 0,
            members: _.map(users, function (o) {
              return o._id
            })
          }

          groups.push(group)
        }

        groupSchema.collection.insert(groups, done)
      },
      function (done) {
        // Populate Tags...
        var tags = getSampleTags()
        var usedTags = []
        var savedTags = []
        for (var i = 0; i < 1001; i++) {
          var tag = _.sample(tags)
          if (_.includes(usedTags, tag)) {
            continue
          }

          var t = {
            name: tag,
            __v: 0
          }

          usedTags.push(tag)
          savedTags.push(t)
        }

        tagSchema.collection.insert(savedTags, done)
      },
      function (done) {
        userSchema.findAll(function (err, users) {
          if (err) return done(err)

          groupSchema.getAllGroups(function (err, groups) {
            if (err) return done(err)

            ticketTypeSchema.getTypes(function (err, types) {
              if (err) return done(err)

              tagSchema.getTags(function (err, tags) {
                if (err) return done(err)

                var loremIpsum = require('lorem-ipsum')
                for (var i = 0; i < 100001; i++) {
                  var user = users[Math.floor(Math.random() * users.length)]
                  var group = groups[Math.floor(Math.random() * groups.length)]
                  var type = types[Math.floor(Math.random() * types.length)]
                  var tagCount = chance.integer({ min: 1, max: 6 })
                  var ticketTags = []
                  for (var k = 0; k < tagCount; k++) {
                    var t = tags[Math.floor(Math.random() * tags.length)]
                    if (!_.includes(ticketTags, t._id)) {
                      ticketTags.push(t._id)
                    }
                  }
                  var randomPriority = type.priorities[Math.floor(Math.random() * type.priorities.length)]
                  var ticket = {
                    __v: 0,
                    // uid: res.value.next,
                    uid: i + 1000,
                    date: randomDate(new Date(2015, 0, 1), new Date()),
                    owner: user._id,
                    group: group._id,
                    type: type._id,
                    tags: ticketTags,
                    status: Math.floor(Math.random() * 4),
                    priority: randomPriority._id,
                    subject: _.sample(subjects),
                    issue: loremIpsum({ count: 3, units: 'paragraph' }),
                    deleted: false
                  }

                  winston.debug('Adding Ticket...(' + i + ')')
                  ticketsToSave.push(ticket)
                }

                return done()
              })
            })
          })
        })
      },
      function (done) {
        winston.debug('Saving Tickets...')
        ticketSchema.collection.insert(ticketsToSave, done)
      },
      function (done) {
        var counterSchema = require('../models/counters')
        counterSchema.setCounter('tickets', 101001, done)
      }
    ],
    function (err) {
      if (err) return res.status(400).send(err)

      return res.send('OK')
    }
  )
}

function randomDate (start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

debugController.sendmail = function (req, res) {
  var mailer = require('../mailer')
  var templateSchema = require('../models/template')
  var Email = require('email-templates')
  // var templateDir = path.resolve(__dirname, '..', 'mailer', 'templates')

  var to = req.query.email
  if (to === undefined) {
    return res.status(400).send('Invalid Email in querystring "email"')
  }

  var email = new Email({
    render: function (view, locals) {
      return new Promise(function (resolve, reject) {
        if (!global.Handlebars) return reject(new Error('Could not load global.Handlebars'))
        templateSchema.findOne({ name: view }, function (err, template) {
          if (err) return reject(err)
          if (!template) return reject(new Error('Invalid Template'))
          var html = global.Handlebars.compile(template.data['gjs-fullHtml'])(locals)
          console.log(html)
          email.juiceResources(html).then(resolve)
        })
      })
    }
  })

  var ticket = {
    uid: 100001,
    comments: [
      {
        date: new Date(),
        comment: 'TESTING',
        owner: {
          fullname: 'test user',
          email: 'test@test.com'
        }
      }
    ]
  }

  email
    .render('ticket-updated', { base_url: global.TRUDESK_BASEURL, ticket: ticket })
    .then(function (html) {
      var mailOptions = {
        to: to,
        subject: 'Trudesk Test Email [Debugger]',
        html: html,
        generateTextFromHTML: true
      }

      mailer.sendMail(mailOptions, function (err) {
        if (err) throw new Error(err)

        return res.status(200).send('OK')
      })
    })
    .catch(function (err) {
      winston.warn(err)
      res.status(400).send(err)
    })
}

debugController.uploadPlugin = function (req, res) {
  var fs = require('fs')
  var path = require('path')
  var Busboy = require('busboy')
  var busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 10 * 1024 * 1024 // 10mb limit
    }
  })

  var object = {}
  var error

  busboy.on('field', function (fieldname, val) {
    if (fieldname === 'plugin') object.plugin = val
  })

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    console.log(mimetype)
    if (mimetype.indexOf('x-zip-compressed') === -1) {
      error = {
        status: 500,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    var savePath = path.join(__dirname, '../../public/uploads/plugins')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.plugin = path.basename(filename)
    object.filePath = path.join(savePath, object.plugin)
    object.mimetype = mimetype

    console.log(object)

    file.on('limit', function () {
      error = {
        status: 500,
        message: 'File too large'
      }

      // Delete the temp file
      // if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath);

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).send(error.message)

    if (_.isUndefined(object.plugin) || _.isUndefined(object.filePath)) {
      return res.status(500).send('Invalid Form Data')
    }

    // Everything Checks out lets make sure the file exists and then add it to the attachments array
    if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk')

    var unzipper = require('unzipper')
    fs.createReadStream(object.filePath).pipe(unzipper.Extract({ path: path.join(__dirname, '../../plugins') }))

    return res.sendStatus(200)
  })

  req.pipe(busboy)
}

function getSampleTags () {
  var tags = [
    'javascript',
    'java',
    'c#',
    'php',
    'android',
    'python',
    'jquery',
    'html',
    'c++',
    'ios',
    'css',
    'mysql',
    'sql',
    'asp.net',
    'ruby-on-rails',
    'objective-c',
    'c',
    '.net',
    'arrays',
    'angularjs',
    'r',
    'json',
    'sql-server',
    'iphone',
    'node.js',
    'ruby',
    'swift',
    'regex',
    'ajax',
    'xml',
    'asp.net-mvc',
    'django',
    'linux',
    'excel',
    'database',
    'wpf',
    'wordpress',
    'spring',
    'string',
    'xcode',
    'windows',
    'vb.net',
    'eclipse',
    'html5',
    'multithreading',
    'angular',
    'bash',
    'git',
    'mongodb',
    'vba',
    'oracle',
    'python-3.x',
    'twitter-bootstrap',
    'forms',
    'image',
    'macos',
    'laravel',
    'algorithm',
    'postgresql',
    'facebook',
    'python-2.7',
    'apache',
    'winforms',
    'visual-studio',
    'matlab',
    'scala',
    'reactjs',
    'performance',
    'excel-vba',
    'list',
    'entity-framework',
    'css3',
    'hibernate',
    'swing',
    'linq',
    'pandas',
    'qt',
    'function',
    'shell',
    'rest',
    '.htaccess',
    'sqlite',
    'maven',
    'api',
    'perl',
    'codeigniter',
    'file',
    'web-services',
    'google-maps',
    'uitableview',
    'unit-testing',
    'symfony',
    'cordova',
    'ruby-on-rails-3',
    'powershell',
    'amazon-web-services',
    'azure',
    'loops',
    'csv',
    'class',
    'google-chrome',
    'validation',
    'sockets',
    'sql-server-2008',
    'sorting',
    'tsql',
    'date',
    'typescript',
    'selenium',
    'xaml',
    'wcf',
    'android-layout',
    'email',
    'jsp',
    'http',
    'spring-mvc',
    'visual-studio-2010',
    'numpy',
    'listview',
    'firebase',
    'android-studio',
    'security',
    'oop',
    'opencv',
    'parsing',
    'c++11',
    'datetime',
    'user-interface',
    'asp.net-mvc-4',
    'delphi',
    'actionscript-3',
    'google-app-engine',
    'batch-file',
    'express',
    'ubuntu',
    'templates',
    'pointers',
    'object',
    'asp.net-mvc-3',
    'debugging',
    'dictionary',
    'variables',
    'session',
    'unix',
    'jquery-ui',
    'ms-access',
    'apache-spark',
    'hadoop',
    'cocoa',
    'magento',
    'for-loop',
    'haskell',
    'internet-explorer',
    'android-fragments',
    'docker',
    'if-statement',
    'authentication',
    'pdf',
    'tomcat',
    'ruby-on-rails-4',
    'flash',
    'ssl',
    'ipad',
    'cocoa-touch',
    'jpa',
    'generics',
    'spring-boot',
    'url',
    'jsf',
    'animation',
    'firefox',
    'facebook-graph-api',
    'redirect',
    'curl',
    'unity3d',
    'winapi',
    'dataframe',
    'elasticsearch',
    'asynchronous',
    'inheritance',
    'exception',
    'testing',
    'opengl',
    'events',
    'nginx',
    'xslt',
    'caching',
    'post',
    'servlets',
    'mod-rewrite',
    'xamarin',
    'math',
    'dom',
    'cakephp',
    'select',
    'd3.js',
    'iis',
    'matplotlib',
    'join',
    'button',
    'recursion',
    'search',
    'gcc',
    'go',
    'react-native',
    'asp.net-web-api',
    'stored-procedures',
    'jenkins',
    'github',
    'image-processing',
    'grails',
    'audio',
    'svg',
    'logging',
    'canvas',
    'java-ee',
    'silverlight',
    'video',
    'heroku',
    'assembly',
    'matrix',
    'meteor',
    'networking',
    'ionic-framework',
    'android-intent',
    'encryption',
    'memory',
    'xpath',
    'selenium-webdriver',
    'gradle',
    'iframe',
    'razor',
    'cookies',
    'web',
    'intellij-idea',
    'laravel-5',
    'optimization',
    'svn',
    'design-patterns',
    'visual-c++',
    'android-activity',
    'core-data',
    'c#-4.0',
    'activerecord',
    'serialization',
    'model-view-controller',
    'arraylist',
    'jdbc',
    'gridview',
    'tensorflow',
    'javafx',
    'flex',
    'multidimensional-array',
    'vector',
    'checkbox',
    'mysqli',
    'mobile',
    'random',
    'soap',
    'sharepoint',
    'google-maps-api-3',
    'visual-studio-2012',
    'amazon-s3',
    'jquery-mobile',
    'extjs',
    'vim',
    'text',
    'plot',
    'input',
    'machine-learning',
    'ember.js',
    'layout',
    'memory-management',
    'boost',
    'file-upload',
    'mvvm',
    'methods',
    'twitter',
    'indexing',
    'netbeans',
    'ggplot2',
    'awk',
    'dynamic',
    'dll',
    'data-structures',
    'flask',
    'amazon-ec2',
    'browser',
    'backbone.js',
    'gwt',
    'design',
    'pdo',
    'zend-framework',
    'groovy',
    'plugins',
    'reporting-services',
    'windows-phone-7',
    'database-design',
    'time',
    'struct',
    'mongoose',
    'unicode',
    'ssh',
    'twitter-bootstrap-3',
    'reflection',
    'tkinter',
    'sed',
    'django-models',
    'npm',
    'lambda',
    'knockout.js',
    'graph',
    'parse.com',
    'visual-studio-2015',
    'hash',
    'data-binding',
    'visual-studio-2013',
    'swift3',
    'firebase-database',
    'file-io',
    'drupal',
    'replace',
    'windows-phone-8',
    'google-apps-script',
    'service',
    'charts',
    'encoding',
    'nhibernate',
    'webpack',
    'sql-server-2005',
    'web-applications',
    'google-chrome-extension',
    'junit',
    'highcharts',
    'drop-down-menu',
    'paypal'
  ]
  return tags
}

module.exports = debugController
