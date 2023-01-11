//++ ShaturaPro LIN 03.08.2022

// tcm - ticket checked mapping
let mongoose = require('mongoose');
var userSchema = require('./user')
let COLLECTION = 'tcm';
let tcmSchema = mongoose.Schema({
    tickedId: { type: mongoose.Schema.Types.ObjectId, ref: 'ticket' },
    ticketUid: { type: String},
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    
});
  
module.exports = mongoose.model(COLLECTION, tcmSchema)

//--