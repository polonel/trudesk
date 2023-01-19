//++ ShaturaPro LIN 03.08.2022

// tcm - ticket checked mapping
let mongoose = require('mongoose');
let COLLECTION = 'tsorting';
let tSortingSchema = mongoose.Schema({
  sorting: { String },
  direction: { String },
  userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
});

//Hi

module.exports = mongoose.model(COLLECTION, tSortingSchema);

//--
