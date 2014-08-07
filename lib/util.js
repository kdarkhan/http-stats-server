'use strict';

var dbmanager = require('./mongoDbManager'),
    constants = require('./constants'),
    childProcess = require('child_process'),
    path = require('path');

function startTest(projectName, callback) {
    callback = callback || function() {};
    var childStreams = {
        stderr: '',
        stdout: ''
    };
    dbmanager.getProject(projectName, function(err, project) {
        if (err) {
            return callback(err);
        }
        if (!project) {
            return callback(new Error('The project is not found'));
        }

        if (project.status === 'running') {
            return callback(new Error('The project is already running'));
        }

        // update project status atomically
        dbmanager.updateProjectStatus(projectName, constants.STATUS_ACTIVE, [constants.STATUS_SUCCESS, constants.STATUS_FAIL],
            function(err) {
                if (err) {
                    return callback(err);
                }

                var childPath = path.resolve(__dirname, './child.js');
                console.log('child path is ', childPath);

                var child = childProcess.fork(childPath, {
                    silent: true
                });

                child.send(project.httpStatsOptions);

                Object.keys(childStreams).forEach(function(stream) {
                    child[stream].on('data', function(chunk) {
                        childStreams[stream] += chunk;
                    });
                });

                child.on('message', function(result) {
                    console.log('child send results ', result);
                    dbmanager.saveResult(result, projectName, function(err) {
                        if (err) {
                            console.error('err occurred while saving res ', err);
                        } else {
                            console.log('successfully wrote to server');
                        }
                    });
                });

                child.on('close', function(code) {
                    console.log('child exited with code ', code);
                    if (code !== 0) {
                        console.log('stdout ', childStreams.stdout);
                        console.log('stderr', childStreams.stderr);
                    }
                    dbmanager.updateProjectStatus(projectName,
                        code === 0 ? constants.STATUS_SUCCESS : constants.STATUS_FAIL,
                        constants.STATUS_ACTIVE,
                        function(err) {
                            if (err) {
                                console.error('err occurred while updating status ', err);
                            }
                        });
                });

                return callback(null);
            });
    });
}

module.exports = {
    startTest: startTest
};
