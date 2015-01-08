var _ = require('underscore');

_.mixin({
    sum: function(obj) {
        if (!_.isArray(obj) || obj.length == 0) return 0;
        return _.reduce(obj, function(sum, n) {
            return sum += n;
        });
    }
});