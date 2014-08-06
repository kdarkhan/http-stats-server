'use strict';

var dbmanager = require('../../lib/mongoDbManager'),
    _ = require('underscore'),
    schedulerUtil = require('../../lib/scheduler-util');

var taskDefaults = {
    enabled: true
};

function parseTask(options, callback) {
    if (options && options.cronString && options.projectName) {
        _.defaults(options, taskDefaults);
        options.enabled = !!options.enabled;
        return callback(null, options);
    } else {
        return callback(new Error('Provided options are not valid'));
    }
}

module.exports = function(router) {
    router.get('/', function(req, res) {
        dbmanager.getSchedulerTasks(function(err, tasks) {
            if (err) {
                res.status(500).json({
                    message: 'Error',
                    error: err.toString()
                });
            } else {
                res.render('scheduler', {
                    tasks: tasks
                });
            }
        });

    });

    router.post('/create_task', function(req, res) {
        console.log('options are ', req.body.options);
        parseTask(req.body.options, function(err, result) {
            if (err) {
                res.status(500).json({
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                if (!schedulerUtil.isValidCronString(result.cronString)) {
                    res.status(400).json({
                        status: 'Error',
                        message: result.cronString + ' is not valid cron string'
                    });
                    return;
                }
                dbmanager.addTask(result, function(err, result) {
                    if (err) {
                        res.status(500).json({
                            status: 'Error',
                            message: err.toString()
                        });
                    } else {
                        res.json({
                            status: 'Success',
                            message: 'Task was added',
                            _id: result[0]._id
                        });
                    }
                });
            }
        });
    });

    router.delete('/', function(req, res) {
        var taskId = req.body.taskId;
        console.log('taskid is ', taskId);
        dbmanager.removeTask(taskId, function(err, first, second) {
            if (err) {
                res.status(500).json({
                    status: 'Error',
                    message: err.toString()
                });
            } else {
                console.log('first is ', first);
                console.log('second is ', second);
                res.json({
                    status: 'Success',
                    message: 'Successfully removed task'
                });
            }
        });
    });
};
