var memwatch = require('memwatch-next');
var winston = require('winston');
memwatch.on('leak', function(info) {
    winston.warn('MEMORY LEAK: ');
    winston.warn(info);
});

var filename = 'memstats.csv';
var firstLine = true;

memwatch.on("stats", function(stats) {
    var fs = require("fs"),
        info = [];

    if(firstLine) {
        info.push("num_full_gc");
        info.push("num_inc_gc");
        info.push("heap_compactions");
        info.push("usage_trend");
        info.push("estimated_base");
        info.push("current_base");
        info.push("min");
        info.push("max");
        fs.appendFileSync(filename, info.join(",") + "\n");
        info = [];
        firstLine = false;
    }

    info.push(stats["num_full_gc"]);
    info.push(stats["num_inc_gc"]);
    info.push(stats["heap_compactions"]);
    info.push(stats["usage_trend"]);
    info.push(stats["estimated_base"]);
    info.push(stats["current_base"]);
    info.push(stats["min"]);
    info.push(stats["max"]);

    fs.appendFile(filename, info.join(",") + "\n");
});