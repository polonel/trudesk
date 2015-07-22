var _        = require('underscore');
var async    = require('async');

module.exports.clearCollections = function(mongoose, callback) {
    if (_.isUndefined(mongoose)) return callback('Not Connected to MongoDB Instance');

    async.series([
        function(done) {
            mongoose.connection.db.dropDatabase(function(){
                done()
            });
        },
        function(done) {
            var counter = require('../../src/models/counters');
            counter.create({
                _id: 'tickets',
                next: 1000
            }, function(err) {
                if (err) return done(err);

                done();
            });
        }
    ], function(err) {
        if (err) return callback(err);
        var collections = _.keys(mongoose.connection.collections);

        if (_.size(collections) > 1) return callback('Collections not Clean');

        callback();
    });
};
