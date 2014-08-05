'use strict';

var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    constants = require('./constants');

var db = null;

function connect(options) {
    MongoClient.connect(options.connectUri, function(err, res) {
        if (err) {
            throw new Error('Could not connect to database');
        }
        console.log('connected to database');

        db = res;
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
    db.collection(constants.PROJECTS_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find().toArray(callback);
    });
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
        db.collection(constants.PROJECTS_COLNAME, function(err, col) {
            if (err) {
                return callback(err);
            }
            col.remove({
                name: projectName
            }, callback);
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

function getScheduledTasks(callback) {
    getAllFromCollection(constants.SCHEDULER_COLNAME, callback);
}

function getActiveScheduledTasks(callback) {
    db.collection(constants.SCHEDULER_COLNAME, function(err, col) {
        if (err) {
            return callback(err);
        }
        col.find({
            active: true
        }, callback);
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

module.exports = {
    addProject: addProject,
    addToCollection: addToCollection,
    clearProjectResults: clearProjectResults,
    connect: connect,
    getAllFromCollection: getAllFromCollection,
    getAllProjects: getAllProjects,
    getLatestResult: getLatestResult,
    getProject: getProject,
    getProjectResults: getProjectResults,
    getResults: getResults,
    removeProject: removeProject,
    saveResult: saveResult,
    getScheduledTasks: getScheduledTasks,
    getActiveScheduledTasks: getActiveScheduledTasks,
    updateProjectStatus: updateProjectStatus,
    getProjectStatus: getProjectStatus
};
