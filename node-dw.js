var sleep = require('system-sleep');
var _ = require('underscore');

var host = 'api.drivewealth.net';
var username = 'alxvilbol';
var password = 'Inversion123';
var sessionId = null;
var deckId = '68DC5A20-EE4F-11E2-A00C-0858C0D5C2ED';
var attrInstruments = null;
var greatInstruments = [];
var events = require('events');
var eventEmitter = new events.EventEmitter();
var counter = 0;

var attractiveParam = "is Neutral";
var tolerance = 0.05
var daysTrading = 7;
var maxPrice = 300;

var httpUtils = require('./httputils-dw');
var avService = require('./avservice-dw');
var dwService = require('./dwservice-dw');
var persistence = require('./persistence-dw');

var successToProcInstruments = [];


function getInstruments(){
  dwService.getInstruments(sessionId)
    .then((instruments) => {
      console.log(instruments.length);
      processInstruments(_.map(instruments, liteInstrument));
    });
}

function processInstruments(instruments) {
  var failedToProcInstruments = [];
  var promises = [];
  var counter = 0;
  instruments.forEach(attrInstrument => {
    var symbol = attrInstrument.symbol;
    var promise = avService.loadHistory(symbol, 'full')
      .then((data) => {
        parseHistoryEntries(symbol, data);
      })
      .catch((e) => {
        console.log("Error when parsing history for symbol: " + symbol + " " + e);
        failedToProcInstruments.push(attrInstrument);
        console.log(failedToProcInstruments.length);
      });
    promises.push(promise);
  });
  Promise.all(promises)
    .then((results) => {
      console.log("To reprocess: " + failedToProcInstruments.length + " instruments");
      if(failedToProcInstruments.length > 0){
        processInstruments(failedToProcInstruments);
      }  
    });
}


function parseHistoryEntries(symbol, jsonResp){
  if(jsonResp["Meta Data"] == null){
    console.log("It will not process jsonResp for symbol: " + symbol);
    return;
  }
  var symbol = jsonResp["Meta Data"]["2. Symbol"];
  var historyEntries = jsonResp["Time Series (Daily)"];
  var promises = [];
  var stockEntries = [];
  Object.keys(historyEntries).forEach(dateEntry => {
    stockEntries.push(toStockEntry(symbol, dateEntry, historyEntries[dateEntry]));
  });
  persistence.updateStockList(stockEntries)
    .then(() => { 
      console.log("Symbol persisted succesfully : " + symbol);
      successToProcInstruments.push(symbol);
      console.log(successToProcInstruments.length); })
    .catch((err) => { console.log("ERROR when persisting: " + err)});
}

function toStockEntry(symbol, dateEntry, historyEntry){
  var result = {
    _id : {
      symbol : symbol,
      dateEntry : dateEntry
    },
    prices : {
      open  : historyEntry["1. open"  ],
      high  : historyEntry["2. high"  ],
      low   : historyEntry["3. low"   ],
      close : historyEntry["4. close" ],
    },
    volume : historyEntry["5. volume"],
    indicators : {
      ema : {},
      macd : {}
    }
  };
  return result;
}

function login() {
  dwService.login(username, password).then((data) => {
    sessionId = data.sessionKey;
    console.log('Logged in:', sessionId);
    getInstruments();
  });
}

function isAttrInstrument(instrument){
  var chaikin = JSON.parse(instrument.chaikinPgr);
  return chaikin.pgrSummaryText.indexOf(attractiveParam) > -1 && instrument.close <= maxPrice;
}

function liteInstrument(instrument){
  return {
      'instrumentID':instrument.instrumentID, 
      'symbol':instrument.symbol
  };
}

function isHighInstrument(instrument){
  var to = new Date();
  to.setUTCHours(0,0,0,0);
  var from = new Date();
  from.setDate(to.getDate() - daysTrading);
  return new Promise((resolve, reject) => {
      httpUtils.performRequest(host, '/v1/bars', 'GET', 
      {
        'instrumentID': instrument.instrumentID,
        'compression': 0,
        'dateStart': from.toISOString().replace(/\.[0-9]{3}/g, ''),
        'dateEnd':to.toISOString().replace(/\.[0-9]{3}/g, '')
      }, 
      {
        "x-mysolomeo-session-key":sessionId
      }, 
      function(data){
        if(data.code && data.code == 500){
          resolve(isHighInstrument(instrument));
        }
        else{
          var chart = data.data;
          var elements = chart.split("|");
          var numbers = _.map(elements, function(elementLine){
            var elemValues = elementLine.split(",");
            return parseFloat(elemValues[4]);
          });
          var numFrom = numbers[0];
          var numTo = numbers[numbers.length - 1];
          var dif = numTo - numFrom;
          resolve(dif > 0 && dif >= (numFrom*tolerance));
        }
      },
      function(err){
        console.log("timeout in " + instrument.instrumentID)
        resolve(isHighInstrument(instrument));
      }
    );
  });
}

login();

eventEmitter.on("processedInstruments", function(){
  console.log(greatInstruments);
});
