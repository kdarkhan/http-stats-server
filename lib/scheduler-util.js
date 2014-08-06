'use strict';

var dbManager = require('./mongoDbManager'),
    CronJob = require('cron').CronJob,
    util = require('./util');

var activeTasks = {};

function startTask(task) {
    var enabled = task.enabled;
    if (enabled) {
        var projectName = task.projectName;
        var cronString = task.cronString;

        var job = new CronJob(cronString, function() {
            // util.startTest(projectName);
            console.log('darkhan, ' + projectName + ' started :)'; 
        }, null, false);

        activeTasks[projectName] = job;

    } else {
        throw new Error('Tried to start disabled task');
    }
}

function initializeScheduler(callback) {
    dbManager.getActiveSchedulerTasks(function(err, tasks) {
        if (err) {
            return callback(err);
        }
        tasks.forEach(startTask);

        return callback(null, tasks);
    });
}


function disableTask(projectName) {
    var job = activeTasks[projectName];
    if (job) {
        job.stop();
        console.log('Task stopped');
    } else {
        console.error('Project task does not exist');
    }
}

module.exports = {
    initializeScheduler: initializeScheduler,
    disableTask: disableTask,
    startTask: startTask
};
