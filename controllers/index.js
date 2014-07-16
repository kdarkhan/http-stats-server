'use strict';


var IndexModel = require('../models/index'),
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

    var stdout = '';
    var stderr = '';

    router.get('/', function(req, res) {
        res.render('index', model);

    });

    router.post('/start_test', function(req, res) {
        console.log('post started');
        console.log('body is', req.body);

        if (!isValidRequest(req.body)) {
            res.json(400, {
                status: 'Error',
                message: 'Invalid request body'
            });
            return;
        }

        if (testActive) {
            res.send(500, {
                status: 'Error',
                message: 'Another test is already active'
            });
        } else {
            testActive = true;

            var childPath = path.resolve(__dirname, '../lib/child.js');
            console.log('path is ', childPath);

            var child = childProcess.fork(childPath);

            // send arguments to the client
            child.send(req.body.startOptions);

            // child send the results
            child.on('message', function(result) {
                console.log('child send the results to parent', result);
                dbmanager.saveResult(result, function(err, res) {
                    if (err) {
                        console.log('err occurred during write', err);
                    } else {
                        console.log('write was successfull', res);  
                    }
                });
            });

            child.on('close', function(code) {
                console.log('child exited with code ', code);
                testActive = false;
            });

            res.json({
                status: 'Success',
                message: 'Test has started'
            });
        }
    });
};
