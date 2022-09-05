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
 *  Updated:    3/13/19 12:21 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')

var ldapGroup = {}

ldapGroup.get = function (req, res) {
  var ldapGroupSchema = require('../../../models/ldapGroup')

  var ldapGroups = []


  async.parallel(
    [
      function (done) {
        ldapGroupSchema.find({}, function (err, l) {
          if (err) return done(err)
          // for(let ldapGroup of l){
          //     ldapGroups.push(ldapGroup.name);
          // }
          ldapGroups = l
          return done()
        })
      }
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      return res.json({ success: true, ldapGroups: ldapGroups })
    }
  )
}

ldapGroup.updateMapping = function (req, res) {
  var roleSchema = require('../../../models/role')
  for (let map of req.body) {
    async.parallel(
      [
        function (done) {
          roleSchema.findOneAndUpdate({ _id: map.roleID }, { ldapGroupID: map.ldapGroupID }, function (err, role) {
            if (err) return done(err)
            return done()
          })
        }
      ],
      function (err) {
        if (err) return res.status(400).json({ success: false, error: err })

        // return res.json({ success: true })
      }
    )

  }

}






module.exports = ldapGroup
