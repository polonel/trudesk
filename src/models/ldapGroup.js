//++ ShaturaPro LIN 03.08.2022

let mongoose = require('mongoose');
let COLLECTION = 'ldapGroups';
let ldapGroupSchema = mongoose.Schema({
    name: { type: String},
    nameRole: { type: String},
    roleID: { type: mongoose.Schema.Types.ObjectId, ref: 'role' }
});

ldapGroupSchema.statics.getLDAPGroups = async function (ldapGroupIds, callback) {
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(ldapGroupIds)) {
          if (typeof callback === 'function') return callback('Invalid Array of LDAP Group IDs - LDAPGroupSchema.GetLDAPGroups()')
          return reject(new Error('Invalid Array of LDAP Group IDs - LDAPGroupSchema.GetLDAPGroups()'))
        }
  
        try {
          const exec = this.model(COLLECTION)
            .find({ _id: { $in: ldapGroupIds } })
            // .populate('members', '_id username fullname email role preferences image title deleted')
            .sort('name')
  
          if (typeof callback === 'function') {
            return exec.exec(callback)
          }
  
          const groups = await exec.exec()
  
          return resolve(groups)
        } catch (e) {
          if (typeof callback === 'function') return callback(e)
          return reject(e)
        }
      })()
    })
  }
  

module.exports = mongoose.model(COLLECTION, ldapGroupSchema)

//--