/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

// var memwatch = require('memwatch-next');
// var winston = require('winston');
// memwatch.on('leak', function(info) {
//     winston.warn('MEMORY LEAK: ');
//     winston.warn(info);
// });
//
// var filename = 'memstats.csv';
// var firstLine = true;
//
// memwatch.on("stats", function(stats) {
//     var fs = require("fs"),
//         info = [];
//
//     if(firstLine) {
//         info.push("num_full_gc");
//         info.push("num_inc_gc");
//         info.push("heap_compactions");
//         info.push("usage_trend");
//         info.push("estimated_base");
//         info.push("current_base");
//         info.push("min");
//         info.push("max");
//         fs.appendFileSync(filename, info.join(",") + "\n");
//         info = [];
//         firstLine = false;
//     }
//
//     info.push(stats["num_full_gc"]);
//     info.push(stats["num_inc_gc"]);
//     info.push(stats["heap_compactions"]);
//     info.push(stats["usage_trend"]);
//     info.push(stats["estimated_base"]);
//     info.push(stats["current_base"]);
//     info.push(stats["min"]);
//     info.push(stats["max"]);
//
//     fs.appendFile(filename, info.join(",") + "\n");
// });
