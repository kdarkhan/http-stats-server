'use strict';

var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    constants = require('./constants'),
    ObjectID = mongodb.ObjectID;

var db = null;

function connect(options, callback) {
    MongoClient.connect(options.connectUri, function(err, res) {
        if (err) {
            throw new Error('Could not connect to database');
        }
        console.log('connected to database');

        db = res;
        resetRunningStatuses(callback);
    });
}

function saveResult(options, projectName, callback) {
    // it is better to store Date object in database (sorting, etc)
    options.timestamp = options.timestamp ? new Date(options.timestamp) : new Date();
    options.projectName = projectName;
    db.collection(constants.RESULTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.insert(options, callback);
    });
}

function getResults(options, callback) {
    db.collection(constants.RESULTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.findOne(options.query, callback);
    });
}

function getAllFromCollection(colName, callback) {
    db.collection(colName, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find().toArray(callback);
    });
}

function addToCollection(colName, doc, callback) {
    db.collection(colName, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.insert([doc], callback);
    });
}

function getProject(projectName, callback) {
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.findOne({
            name: projectName
        }, {
            _id: 0
        }, callback);
    });
}

function getProjectResults(projectName, callback) {
    db.collection(constants.RESULTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find({
            projectName: projectName
        }, {
            _id: 0
        })
            .sort({
                timestamp: -1
            })
            .limit(constants.DEFAULT_RESULTSET_LIMIT)
            .toArray(function(err, result) {
                if (err) {
                    return callback(err);
                }
                // the data is in reverse order, reverse it first
                return callback(null, result.reverse());
            });
    });
}

function getLatestResult(projectName, callback) {
    db.collection(constants.RESULTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        } else {
            col.findOne({
                projectName: projectName
            }, {
                _id: 0
            }, {
                sort: {
                    timestamp: -1
                },
            }, callback);
        }
    });
}

function getAllProjects(callback) {
    /*
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find().toArray(callback);
    });
*/

    getAllFromCollection(constants.PROJECTS_COLNAME, callback);
}

function clearProjectResults(projectName, callback) {
    db.collection(constants.RESULTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.remove({
            projectName: projectName
        }, callback);
    });
}

function removeProject(projectName, callback) {
    clearProjectResults(projectName, function(err) {
        if (err) {
            return callback(err);
        }

        clearProjectTasks(projectName, function(err) {
            if (err) {
                return callback(err);
            }
            db.collection(constants.PROJECTS_COLNAME, function(err, col) {
                if (err) {
                    return callback(err);
                }
                col.remove({
                    name: projectName
                }, callback);
            });
        });


    });
}

function getProjectStatus(projectName, callback) {
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.findOne({
            name: projectName
        }, function(err, project) {
            if (err) {
                return callback(err);
            }
            return callback(null, project.status);
        });
    });
}

function addProject(projectDoc, callback) {
    var projectName = projectDoc && projectDoc.name;
    if (projectName) {
        getProject(projectName, function(err, res) {
            if (err) {
                return callback(err);
            } else if (res) {
                return callback('Project already exists');
            } else {
                projectDoc.status = projectDoc.status || constants.STATUS_SUCCESS;
                addToCollection(constants.PROJECTS_COLNAME, projectDoc, callback);
            }
        });
    } else {
        return callback(new Error('Invalid project name'));
    }
}

function getSchedulerTasks(callback) {
    getAllFromCollection(constants.SCHEDULER_COLNAME, callback);
}

function getActiveSchedulerTasks(callback) {
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find({
            enabled: true
        }).toArray(callback);
    });
}

/**
 * Valid status is one of 'running', 'fail', 'success'
 */
function updateProjectStatus(projectName, newStatus, oldStatus, callback) {
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }

        var query = {
            name: projectName
        };

        query.status = Array.isArray(oldStatus) ? {
            $in: oldStatus
        } : oldStatus;

        console.log('query is ', query);

        col.update(query, {
            $set: {
                status: newStatus
            }
        }, function(err, res, writeResult) {
            if (err) {
                return callback(err);
            }

            if (writeResult.n !== 1) {
                return callback(new Error('Update ' + writeResult.n + ' objects'));
            }
            return callback(null);
        });
    });
}

function addTask(task, callback) {
    var projectName = task.projectName;
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.findOne({
            name: projectName
        }, function(err, result) {
            if (err) {
                return callback(err);
            }
            if (result) {
                addToCollection(constants.SCHEDULER_COLNAME, task, callback);
            } else {
                return callback(new Error('Task references non existing project'));
            }
        });
    });
}

function removeTask(taskId, callback) {
    console.log('task to remove has id ', taskId);
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.remove({
            _id: new ObjectID.createFromHexString(taskId)
        }, function(err, count) {
            if (err) {
                return callback(err);
            }
            if (count < 1) {
                return callback(new Error('The task was not found'));
            }
            return callback();

        });
    });
}

function clearProjectTasks(projectName, callback) {
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.remove({
            projectName: projectName
        }, callback);
    });
}

function resetRunningStatuses(callback) {
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.update({
            status: 'running'
        }, {
            $set: {
                status: constants.STATUS_FAIL
            }
        }, callback);
    });
}

function toggleTask(taskId, enable, callback) {
    console.log('%j %j', taskId, enable);
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.update({
            _id: new ObjectID.createFromHexString(taskId),
            enabled: !enable 
        }, {
            $set: {
                enabled: enable
            }
        }, function(err, first, second) {
            console.log('err %j first %j second %j', err, first, second);
            if (err) {
                return callback(err);
            } 
            if (first === 0) {
                return callback(new Error('Did not update anything')); 
            }
            return callback();
        });
    });
}

function getTaskById(taskId, callback) {
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.findOne({
            _id: new ObjectID.createFromHexString(taskId)
        }, callback);
    });
}

module.exports = {
    addProject: addProject,
    addTask: addTask,
    addToCollection: addToCollection,
    clearProjectResults: clearProjectResults,
    clearProjectTasks: clearProjectTasks,
    connect: connect,
    getActiveSchedulerTasks: getActiveSchedulerTasks,
    getAllFromCollection: getAllFromCollection,
    getAllProjects: getAllProjects,
    getLatestResult: getLatestResult,
    getProject: getProject,
    getProjectResults: getProjectResults,
    getProjectStatus: getProjectStatus,
    getResults: getResults,
    getSchedulerTasks: getSchedulerTasks,
    getTaskById: getTaskById,
    removeProject: removeProject,
    removeTask: removeTask,
    saveResult: saveResult,
    toggleTask: toggleTask,
    updateProjectStatus: updateProjectStatus
};
