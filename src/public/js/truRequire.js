//This gets loaded for accessing require from outside Webpack bundle.
var allMods = {
    jquery: function() { return require('jquery'); },
    snackbar: function() { return require('snackbar'); },
    underscore: function() { return require('underscore'); }
};

module.exports = function (modules, cb) {
    var loadedModules = modules.map(function(x) {
        return allMods[x]();
    });

    cb(loadedModules);
};