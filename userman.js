var mongodb = require('./lib/db.js');
var async = require('async');

exports.getUser = function(query, callback) {
  async.waterfall([
    function(callback) {
      mongodb.open(callback);
    },
    function(db, callback) {
      db.collection('users', callback);
    },
    function(collection, callback) {
      collection.findOne(query, callback);
    },
  ], function(err, doc) {
    mongodb.close();
    callback(err, doc);
  });
};

exports.updateNet9 = function(net9_user_info, callback) {
  var uid = parseInt(net9_user_info['uid']);
  var username = net9_user_info['name'];
  delete net9_user_info['uid'];
  delete net9_user_info['name'];
  
  async.waterfall([
    function(callback) {
      mongodb.open(callback);
    },
    function(db, callback) {
      db.collection('users', callback);
    },
    function(collection, callback) {
      async.waterfall([
        function(callback) {
          async.parallel([
            function(callback) {
              collection.ensureIndex('uid', {unique: true}, callback);
            },
            function(callback) {
              collection.ensureIndex('username', {unique: true}, callback);
            },
          ], function(err, result) {
            if (err) {
              callback(err);
            } else {
              collection.findOne({uid: uid}, callback);
            }
          });
        },
        function(doc, callback) {
          if (doc) {
            doc.net9 = net9_user_info;
          } else {
            doc = {
              uid: uid,
              username: username,
              net9: net9_user_info,
            };
          }
          collection.update({uid: uid}, doc, {safe: true, upsert: true}, callback);
        },
      ], function(err, result) {
        callback(err);
      });
    },
  ], function(err, result) {
    mongodb.close();
    callback(err);
  });
};

exports.regDomain = function regDomain(domain, callback) {
  async.waterfall([
    function(callback) {
      mongodb.open(callback);
    },
    function(db, callback) {
      db.collection('domains', callback);
    },
    function(collection, callback) {
      async.waterfall([
        function(callback) {
          collection.ensureIndex('name', {unique: true}, callback);
        },
        function(indexName, callback) {
          collection.ensureIndex('username', callback);
        },
        function(indexName, callback) {
          collection.findOne({name: domain.name}, callback);
        },
        function(doc, callback) {
          if (doc && doc.username != domain.username) {
            //The existing domain record not belong to current user
            callback('domain-exist');
          } else {
            doc = domain;
          }
          collection.update({name: domain.name}, doc, {safe: true, upsert: true}, callback);
        },
      ], function(err, doc) {
        callback(err, doc);
      });
    },
  ], function(err) {
    //Do modification on DNS configuration
    mongodb.close();
    callback(err);
  });
};

exports.getDomains = function getDomains(cond, callback) {
  async.waterfall([
    function(callback) {
      mongodb.open(callback);
    },
    function(db, callback) {
      db.collection('domains', callback);
    },
    function(collection, callback) {
      var cursor = collection.find(cond);
      cursor.toArray(callback);
    },
  ], function(err, docs) {
    mongodb.close();
    callback(err, docs);
  });
};
