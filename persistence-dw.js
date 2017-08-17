var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/stocks';
var mongoDb = null;


function getStockEntryFromDB(db, symbol, dateEntry){
  return db.collection('stocks_data').findOne(
    {
      _id : {
        symbol : symbol, 
        dateEntry : dateEntry
      }
    }
  );
}

function getSymbolsFromDB(db){
  var promise = db.collection('stocks_data').distinct('_id.symbol');
  return promise;
}

function getStockEntriesFromDB(db, symbol){
  var promise = db.collection('stocks_data').find({"_id.symbol" : symbol}).sort({'_id.dateEntry':1}).toArray();
  return promise;
}

function updateStockListFromDB(db, stockList){
  var bulkUpdateOps = [];
  stockList.forEach(function(stockItem){
    bulkUpdateOps.push({
      "updateOne": {
        "filter": { "_id" : stockItem._id},
        "update": stockItem,
        "upsert": true
      }
    });
  });
  var options = {
    "ordered" : true,
    "w" : 1
  };
  var promise = db.collection('stocks_data').bulkWrite(bulkUpdateOps, options);
  return promise;
}

function getStockEntries(symbol){
  return getDb()
    .then(function(){
      return getStockEntriesFromDB(mongoDb, symbol);
    });
}

function getSymbols(){
  return getDb()
    .then(function(){
      return getSymbolsFromDB(mongoDb);
    });
}

function getStockEntry(symbol, dateEntry){
  return getDb()
    .then(function(){
      return getStockEntryFromDB(mongoDb, symbol, dateEntry);
    });
}

function updateStockList(stockList){
  return getDb().then(function() {
    return updateStockListFromDB(mongoDb, stockList);
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
  getStockEntry : getStockEntry,
  getStockEntries : getStockEntries,
  updateStockList : updateStockList,
  closeConnection : closeConnection,
  getSymbols : getSymbols,
  loadMongoDb : loadMongoDb
};