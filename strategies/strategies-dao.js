var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/stocks';
var mongoDb = null;

function updateStrategyRatesFromDB(db, strategyName, strategyRateList){
  var bulkUpdateOps = [];
  strategyRateList.forEach(function(strategyRateItem){
    bulkUpdateOps.push({
      "updateOne": {
        "filter": { "_id" : strategyRateItem._id},
        "update": strategyRateItem,
        "upsert": true
      }
    });
  });
  var options = {
    "ordered" : true,
    "w" : 1
  };
  var promise = db.collection(strategyName).bulkWrite(bulkUpdateOps, options);
  return promise;
}

function getStrategyRatesFromDB(db, date, strategyName){
  var promise = db.collection(strategyName).find({"_id.dateEntry" : date}).sort({'total':1}).toArray();
  return promise;
}

function getStrategyRates(date, strategyName){
  return getDb()
    .then(function(){
      return getStrategyRatesFromDB(mongoDb, date, strategyName);
    });
}

function updateStrategyRates(strategyName, strategyRateList){
  return getDb().then(function() {
    return updateStrategyRatesFromDB(mongoDb, strategyName, strategyRateList);
  });
}

function getDb(){
  return MongoClient.connect(url)
    .then(function(db){
      mongoDb = db;
    });
}

function loadMongoDb(){
  return mongoDb;
}

function closeConnection(){
  mongoDb.close();
}

module.exports = {
  getStrategyRates : getStrategyRates,
  updateStrategyRates : updateStrategyRates,
  closeConnection : closeConnection,
  loadMongoDb : loadMongoDb
};