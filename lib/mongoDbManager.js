var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    nconf = require('nconf');

var db = null;
var collection = null;

module.exports.connect = function connect(options, callback) {
    MongoClient.connect(options.connectUri, function(err, res) {
        if (err) {
            console.log('could not connect to database');
            return callback(err);
        }
        console.log('connected to database');

        db = res;

        // if collection exists, this will not do anything
        db.createCollection(options.collectionName, function(err, col) {
            if (err) {
                return callback(err);
            }
            collection = col;
            return callback(null, collection);
        });
    });
}

module.exports.saveResult = function saveResult(options, callback) {
	collection.insert([options.data], callback);
}

module.exports.getResults = function getResults(options, callback) {
	collection.findOne(options.query, callback);
}
