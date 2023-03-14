//++ ShaturaPro LIN 03.08.2022

// tcm - ticket checked mapping
let mongoose = require('mongoose');
let COLLECTION = 'blacklist';
let blacklistSchema = mongoose.Schema(
  {
    regex: { type: String, unique: true },
    reason: String,
    key: { type: String, unique: true },
  },
  { timestamps: true }
);

//Hi

module.exports = mongoose.model(COLLECTION, blacklistSchema);

//--
