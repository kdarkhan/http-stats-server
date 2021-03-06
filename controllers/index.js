'use strict';

var dbmanager = require('../lib/mongoDbManager');

module.exports = function(router) {

    router.get('/', function(req, res) {
        dbmanager.getAllProjects(function(err, projects) {
            if (err) {
                res.status(500).json({
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                projects.forEach(function(project) {
                    project.creationTime = project._id.getTimestamp();
                });
                res.render('index', {
                    projects: projects
                });
            }
        });
    });
};
