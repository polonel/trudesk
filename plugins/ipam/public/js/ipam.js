window.truRequire(['jquery'], function(loadedModules) {
    var $ = loadedModules[0];
    setTimeout(function() {
        $('.ipam-test').css({color: 'green'});
    }, 4000);
});