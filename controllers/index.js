'use strict';

var dbmanager = require('../lib/mongoDbManager'),
    childProcess = require('child_process'),
    path = require('path');

var PROJECT_COLNAME = 'projects';

module.exports = function(router) {

    var testActive = false;
    var activeProject = '';
    var childStreams = {};

    router.get('/', function(req, res) {
        dbmanager.getAllProjects(function(err, projects) {
            if (err) {
                res.json(500, {
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                projects.forEach(function(project) {
                    project.creationTime = project._id.getTimestamp();
                });
                res.render('projects', {
                    projects: projects,
                    testKey: 'hello there'
                });
            }
        });
    });

    function parseProject(options) {
        var result = {
            name: options.name,
            httpStatsOptions: {
                url: options.url,
                beginConcurrency: Number(options.beginConcurrency),
                peakConcurrency: Number(options.peakConcurrency),
                endConcurrency: Number(options.endConcurrency),
                concurrencyIncrement: Number(options.concurrencyIncrement),
                concurrencyDecrement: Number(options.concurrencyDecrement),
                stepRequests: Number(options.stepRequests),
                delay: Number(options.delay),
                warmup: options.warmup,
                spawn: options.spawn
            }
        };

        var requestOptions;
        try {
            requestOptions = JSON.parse(options.requestOptions);
        } catch (err) {
            requestOptions = {};
        }
        result.httpStatsOptions.requestOptions = requestOptions;
        if (options.requestTimeout) {
            result.httpStatsOptions.requestTimeout = Number(options.requestTimeout);
        }
        return result;
    }

    router.post('/create_new', function(req, res) {
        var newProject = parseProject(req.body.options);
        console.log('I am here', newProject);
        if (newProject) {
            newProject.lastTestResult = 'success';
            dbmanager.addToCollection(PROJECT_COLNAME, newProject, function(err, result) {
                if (err) {
                    res.json(500, {
                        status: 'Error',
                        message: err.toString()
                    });
                } else {
                    var project = result[0];
                    res.json({
                        status: 'Success',
                        message: 'Successfully added to collection',
                        data: {
                            name: project.name,
                            timestamp: project._id.getTimestamp()
                        }
                    });
                }
            });
        } else {
            console.log('if false');
            res.json(500, {
                status: 'Error',
                message: 'Invalid request'
            });
        }
    });

    router.get('/get_status', function(req, res) {
        res.json({
            testRunning: testActive,
            projectName: activeProject
        });
    });

    router.get('/:name/get_status', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getLastStatus(projectName, function(err, result) {
            if (err) {
                res.json(503, {
                    status: err
                });
            } else {
                res.json({
                    status: result
                });
            }
        });
    });

    router.get('/:name', function(req, res) {
        var projectName = req.params.name;
        // service names use relative urls and
        // they do not work without trailing slash at the end
        if (req.url.slice(-1) !== '/') {
            res.redirect(projectName + '/');
        } else {
            dbmanager.getProject(projectName, function(err, project) {
                if (err) {
                    res.json(500, {
                        status: 'Error',
                        message: err.toString()
                    });
                } else {
                    if (project) {
                        // get projects
                        dbmanager.getProjectResults(projectName, function(err, results) {
                            if (err) {
                                res.json(500, {
                                    status: 'Error',
                                    message: err.toString()
                                });
                            } else {
                                res.render('project_view', {
                                    project: project,
                                    results: JSON.stringify(results)
                                });
                            }
                        });
                    } else {
                        console.log(typeof result);
                        res.send('Project ' + projectName + ' does not exist');
                    }
                }
            });
        }
    });

    router.post('/:name/start_test', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProject(projectName, function(err, project) {
            if (err || !project) {
                // redirect to current project without start_test
                res.redirect('.');
            } else {
                if (testActive || project.lastTestResult === 'running') {
                    res.json(503, {
                        status: 'Error',
                        message: 'Another test is already running'
                    });
                } else {
                    testActive = true;
                    dbmanager.setLastStatus(projectName, 'running', function(err) {
                        if (err) {
                            console.log('err happened');
                            res.json(503, {
                                status: 'Error',
                                message: err.toString()
                            });
                        } else {
                            console.log('dude here');
                            activeProject = projectName;
                            childStreams = {
                                stdout: '',
                                stderr: ''
                            };

                            var childPath = path.resolve(__dirname, '../lib/child.js');
                            console.log('child path is ', childPath);

                            var child = childProcess.fork(childPath, {
                                silent: true
                            });

                            child.send(project.httpStatsOptions);

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
                                testActive = false;
                                dbmanager.setLastStatus(projectName, code === 0 ? 'success' : 'error',
                                    function(err) {
                                        if (err) {
                                            console.error(err);
                                        }
                                    });
                                activeProject = '';
                                console.log('child stdout was ', childStreams.stdout);
                            });

                            Object.keys(childStreams).forEach(function(stream) {
                                child[stream].on('data', function(chunk) {
                                    childStreams[stream] += chunk;
                                });
                            });

                            res.json({
                                status: 'Success',
                                message: 'Test has started'
                            });
                        }
                    });




                }
            }
        });
    });

    router.get('/:name/get_logs', function(req, res) {
        res.json(childStreams);
    });

    router.get('/:name/get_latest_result', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getLatestResult(projectName, function(err, result) {
            if (err) {
                res.json(500, err);
            } else {
                res.json(result);
            }
        });
    });

    router.get('/:name/raw', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProjectResults(projectName, function(err, results) {
            if (err) {
                res.json(500, err);
            } else {
                res.json(results);
            }
        });
    });

    router.post('/:name/clear_results', function(req, res) {
        var projectName = req.params.name;
        dbmanager.clearProjectResults(projectName, function(err) {
            if (err) {
                res.json(500, {
                    status: 'Error',
                    message: err
                });
            } else {
                res.json({
                    status: 'Success',
                    message: 'Successfully cleared results'
                });
            }
        });
    });

    router.delete('/:name', function(req, res) {
        var projectName = req.params.name;
        dbmanager.removeProject(projectName, function(err) {
            if (err) {
                res.json(500, {
                    status: 'Error',
                    message: err
                });
            } else {
                res.json({
                    status: 'Success',
                    message: 'Successfuly removed the project ' + projectName
                });
            }
        });
    });
};
