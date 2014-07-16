'use strict';

var dbmanager = require('../lib/mongoDbManager');

var PROJECT_COLNAME = 'projects';

module.exports = function(router) {

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

    router.post('/create_new', function(req, res) {
        var newProject = req.body.options;
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
                            /*
                            res.json({
                                project: result,
                                results: results
                            });
                            */
                        }
                    });
                } else {
                    console.log(typeof result);
                    res.send('Project ' + projectName + ' does not exist');
                }
            }
        });
    });

    router.get('/:name/start_test', function(req, res) {
        var projectName = req.params.name;
        dbmanager.getProject(projectName, function(err, result) {
            if (err || !result) {
                // redirect to current project without start_test
                res.redirect('.');
            } else {

            }
        });
    });
};
