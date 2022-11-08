//++ ShaturaPro LIN 03.08.2022

let mongoose = require('mongoose');
let COLLECTION = 'domains';
let domainSchema = mongoose.Schema({
    name: { type: String },
    groupID: { type: mongoose.Schema.Types.ObjectId, ref: 'group' }
});

module.exports = mongoose.model(COLLECTION, domainSchema)

//--