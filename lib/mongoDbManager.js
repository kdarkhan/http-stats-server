'use strict';

var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    constants = require('./constants');

var db = null;
var collection = null;

function connect(options, callback) {
    MongoClient.connect(options.connectUri, function(err, res) {
        if (err) {
            console.log('could not connect to database');
            return callback(err);
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
        }).toArray(callback);
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

module.exports = {
    connect: connect,
    saveResult: saveResult,
    getResults: getResults,
    getAllFromCollection: getAllFromCollection,
    addToCollection: addToCollection,
    getProject: getProject,
    getAllProjects: getAllProjects,
    getProjectResults: getProjectResults
};
