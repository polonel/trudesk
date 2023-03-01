//++ ShaturaPro LIN 03.08.2022

// tcm - ticket checked mapping
let mongoose = require('mongoose');
let COLLECTION = 'blacklist';
let blacklistSchema = mongoose.Schema({
  email: String,
});

//Hi

module.exports = mongoose.model(COLLECTION, blacklistSchema);

//--
