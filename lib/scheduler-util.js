'use strict';

var dbManager = require('./mongoDbManager'),
    CronJob = require('cron').CronJob,
    util = require('./util');

var activeTasks = {};

function startTask(task) {
    if (!task) {
        console.warn('startTask: task is not provided');
        return;
    }
    var enabled = task.enabled;
    if (enabled) {
        var projectName = task.projectName;
        var cronString = task.cronString;

        try {
            var job = new CronJob(cronString, function() {
                console.log('Starting task for project %s and cronString %s',
                    projectName, cronString);
                util.startTest(projectName, function(err) {
                    if (err) {
                        console.error('Test completed with error %j', err);
                    } else {
                        console.log('Test successfully completed');
                    }
                });
            }, null, true);

            activeTasks[task._id] = job;
        } catch (e) {
            console.error('Error while starting the job %j', e);
        }

    } else {
        console.log('not starting disabled task');
    }
}

function initializeScheduler(callback) {
    dbManager.getActiveSchedulerTasks(function(err, tasks) {
        if (err) {
            if (callback) {
                return callback(err);
            }
            throw new Error('Failed to get active tasks');
        }
        console.log('tasks are ', tasks);
        tasks.forEach(startTask);
        // return callback(null, tasks);
    });
}


function stopTask(taskId) {
    var job = activeTasks[taskId];
    if (job) {
        job.stop();
        console.log('Task stopped');
        delete activeTasks[taskId];

    } else {
        console.error('The task %s is not found', taskId);
    }
}

function isValidCronString(cronString) {
    try {
        new CronJob(cronString, function() {
            // do nothing
        });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    initializeScheduler: initializeScheduler,
    stopTask: stopTask,
    startTask: startTask,
    isValidCronString: isValidCronString
};
