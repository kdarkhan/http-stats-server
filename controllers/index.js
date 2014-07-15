'use strict';


var IndexModel = require('../models/index'),
    nconf = require('nconf'),
    dbmanager = require('../lib/mongoDbManager'),
    httpStats = require('http-stats'),
    childProcess = require('child_process'),
    path = require('path');


module.exports = function(router) {

    function isValidRequest(reqBody) {
        if (reqBody) {
            return reqBody.hasOwnProperty('startOptions');
        } else {
            return false;
        }
    }

    var model = new IndexModel();

    var testActive = false;
    var logMessage = '';

    router.get('/', function(req, res) {
        res.render('index', model);

    });

    router.post('/start_test', function(req, res) {
        console.log('post started');
        console.log('body is', req.body);

        if (!isValidRequest(req.body)) {
            res.send(JSON.stringify({
                status: 'Error',
                message: 'Invalid request body'
            }));
            return;
        }

        if (testActive) {
            res.send(JSON.stringify({
                status: 'Error',
                message: 'Another test is already active'
            }));
        } else {
            testActive = true;

            var childPath = path.resolve(__dirname, '../lib/child.js');
            console.log('path is ', childPath);

            var child = childProcess.fork(childPath);


            console.log('send to child');

            // send arguments to the client
            child.send(req.body.startOptions);

            // child send the results
            child.on('message', function(result) {
                console.log('child send the results to parent', result);
            });

            child.on('close', function(code) {
                console.log('child exited with code ', code);
                testActive = false;
            });

            res.send(JSON.stringify({
                status: 'Success',
                message: 'Test has started'
            }));
        }
    });
};
