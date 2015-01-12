var emitter = require('../emitter');

emitter.on('newTicket', function() {
    console.log('test');
});