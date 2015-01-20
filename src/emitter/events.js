"use strict";

var winston = require('winston');
var emitter = require('../emitter');

(function() {
    //winston.info('Binding to Events');

    emitter.on('ticket:updated', function(ticketOid) {

    });
})();
