var _        = require('underscore');
var async    = require('async');

module.exports.clearCollections = function(mongoose, callback) {
  if (_.isUndefined(mongoose)) return callback('Not Connected to MongoDB Instance');
  var collections = _.keys(mongoose.connection.collections);

  async.forEach(collections, function(collectionName, done) {
      var collection = mongoose.connection.collections[collectionName];
      collection.drop(function(err) {
          if (err) return done(err);

          done(null);
      });
  }, function(err) {
      if (err) return callback(err);

      callback();
  });
};
