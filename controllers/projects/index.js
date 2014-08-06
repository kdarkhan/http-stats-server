'use strict';

var dbmanager = require('../../lib/mongoDbManager'),
    util = require('../../lib/util'); // ,
// childProcess = require('child_process'),
// path = require('path');

module.exports = function(router) {

    var testActive = false;
    var activeProject = '';
    var childStreams = {};

    router.get('/', function(req, res) {
        res.redirect('/');
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
                spawn: options.spawn,
                pm2: options.pm2
            }
        };

        if (options.pm2 && options.pm2.enabled) {
            options.pm2.enabled = options.pm2.enabled.toLowerCase() === 'true';
        }

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
        if (newProject) {
            newProject.status = 'success';
            dbmanager.addProject(newProject, function(err, result) {
                if (err) {
                    res.status(500).json({
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
            res.status(500).json({
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
        dbmanager.getProjectStatus(projectName, function(err, result) {
            if (err) {
                res.status(500).json({
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
                    res.status(500).json({
                        status: 'Error',
                        message: err.toString()
                    });
                } else {
                    if (project) {
                        // get projects
                        dbmanager.getProjectResults(projectName, function(err, results) {
                            if (err) {
                                res.status(500).json({
                                    status: 'Error',
                                    message: err.toString()
                                });
                            } else {
                                res.render('project', {
                                    project: project,
                                    results: JSON.stringify(results)
                                });
                            }
                        });
                    } else {
                        res.send('Project ' + projectName + ' does not exist');
                    }
                }
            });
        }
    });

    router.post('/:name/start_test', function(req, res) {

        var projectName = req.params.name;
        util.startTest(projectName, function(err) {
            if (err) {
                res.status(500).json({
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                res.json({
                    status: 'Success',
                    message: 'Test has started'
                });
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
                res.status(500).json(err);
            } else {
                res.json(result);
            }
        });
    });

    router.get('/:name/raw', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProjectResults(projectName, function(err, results) {
            if (err) {
                res.status(500).json(err);
            } else {
                res.json(results);
            }
        });
    });

    router.post('/:name/clear_results', function(req, res) {
        var projectName = req.params.name;
        dbmanager.clearProjectResults(projectName, function(err) {
            if (err) {
                res.status(500).json({
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
                res.status(500).json({
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
