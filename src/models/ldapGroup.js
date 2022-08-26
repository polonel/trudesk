//++ ShaturaPro LIN 03.08.2022

let mongoose = require('mongoose');
let COLLECTION = 'ldapGroups';
let ldapGroupSchema = mongoose.Schema({
    name: { type: String},
    nameRole: { type: String},
    roleID: { type: mongoose.Schema.Types.ObjectId, ref: 'role' }
});

module.exports = mongoose.model(COLLECTION, ldapGroupSchema)

//--