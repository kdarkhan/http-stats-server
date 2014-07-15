'use strict';

var httpStats = require('http-stats');

var WAITTIME = 120000; // wait time, 2 mins


console.log('child started');

var waitTimer = setTimeout(function() {
    console.error('Failed to receive args from the server');
    process.exit(1);
}, WAITTIME);


function parseParameters(parameters) {
    return {
        url: parameters.url,
        beginConcurrency: Number(parameters.beginConcurrency),
        peakConcurrency: Number(parameters.peakConcurrency),
        endConcurrency: Number(parameters.endConcurrency),
        concurrencyIncrement: Number(parameters.concurrencyIncrement),
        concurrencyDecrement: Number(parameters.concurrencyDecrement),
        stepRequests: Number(parameters.stepRequests),
        delay: Number(parameters.delay)
    };
}


// it is expected that the server will send the arguments to the child
process.on('message', function(msg) {
    // clear the timer
    clearTimeout(waitTimer);

    console.log('child received ', msg);

    var emitter = httpStats.measure(parseParameters(msg), function(err, results) {

        console.log('test is complete');
        if (err) {
        	console.log(err);
            process.exit(1);
        }

        // send the results to the parent
        process.send(results);
        console.log('results were sent to the parent');

        process.exit(0);
    });
});
