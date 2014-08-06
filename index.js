'use strict';


var kraken = require('kraken-js'),
    app = require('express')(),
    dbmanager = require('./lib/mongoDbManager'),
    options = {
        onconfig: function(config, next) {
            //any config setup/overrides here
            next(null, config);
        }
    },
    port = process.env.PORT || 8000,
    nconf = require('nconf'),
    scheduler = require('./lib/scheduler-util.js');

nconf.argv()
    .env()
    .file({
        file: './config/config.json'
    });

dbmanager.connect({
    connectUri: nconf.get('mongodb:connectionUri')
}, function() {
    scheduler.initializeScheduler();
});


app.use(kraken(options));


app.listen(port, function() {
    console.log('[%s] Listening on http://localhost:%d', app.settings.env, port);
});
