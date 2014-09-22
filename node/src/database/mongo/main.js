"use strict";

var winston = require('winston');

module.exports = function(db, module) {
    var helpers = module.helpers.mongo;

    module.flushdb = function(callback) {
        db.dropDatabase(helpers.done(callback));
    };

    module.exists = function(key, callback) {
        db.collection('objects').findOne({_key: _key}, function(err, item) {
            callback(err, item !== undefined && item != null);
        });
    };
};