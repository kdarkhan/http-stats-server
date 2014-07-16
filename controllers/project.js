'use strict';

var dbmanager = require('../lib/mongoDbManager'),
    childProcess = require('child_process'),
    path = require('path');

var PROJECT_COLNAME = 'projects';

module.exports = function(router) {

    var testActive = false;

    router.get('/', function(req, res) {
        res.redirect('all');
    });

    router.get('/all', function(req, res) {
        dbmanager.getAllProjects(function(err, projects) {
            if (err) {
                res.json(500, {
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                res.render('projects', {
                    projects: projects,
                    testKey: 'hello there'
                });
                //res.json(result);
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
                warmup: options.warmup
            }
        };
        return result;
    }

    router.post('/create_new', function(req, res) {
        var newProject = parseProject(req.body.options);
        console.log('I am here', newProject);
        if (newProject) {
            console.log('if true');
            dbmanager.addToCollection(PROJECT_COLNAME, newProject, function(err, result) {
                if (err) {
                    res.json(500, {
                        status: 'Error',
                        message: err.toString()
                    });
                } else {
                    res.json({
                        status: 'Success',
                        message: 'Successfully added to collection'
                    });
                }
            });
        } else {
            console.log('if false');
            res.json(400, {
                status: 'Error',
                message: 'Invalid request'
            });
        }
    });

    router.get('/:name', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProject(projectName, function(err, project) {
            if (err) {
                res.json(400, {
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                if (project) {
                    // get projects
                    dbmanager.getProjectResults(projectName, function(err, results) {
                        if (err) {
                            res.json(400, {
                                status: 'Error',
                                message: err.toString()
                            });
                        } else {
                            res.render('project_view', {
                                project: project,
                                results: results
                            });
                        }
                    });
                } else {
                    console.log(typeof result);
                    res.send('Project ' + projectName + ' does not exist');
                }
            }
        });
    });

    router.post('/:name/start_test', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProject(projectName, function(err, project) {
            if (err || !project) {
                // redirect to current project without start_test
                res.redirect('.');
            } else {
                if (testActive) {
                    res.json({
                        status: 'Error',
                        message: 'Another test is already running'
                    });
                } else {
                    testActive = true; 
                    var childPath = path.resolve(__dirname, '../lib/child.js');
                    console.log('child path is ', childPath);

                    var child = childProcess.fork(childPath);

                    child.send(project.httpStatsOptions);

                    child.on('message', function(result) {
                        console.log('child send results ', result);
                        dbmanager.saveResult(result, projectName, function(err, dbres) {
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
                    });

                    res.json({
                        status: 'Success',
                        message: 'Test has started'
                    });
                }
            }
        });
    });
};
