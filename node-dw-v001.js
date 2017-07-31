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

var attractiveParam = "is Neutral";
var tolerance = 0.05
var daysTrading = 7;
var maxPrice = 300;

var httputils = require('./httputils-dw');
var avService = require('./avservice-dw');


function getInstruments(){
  httpUtils.performRequest('/v1/instruments', 'GET', {
  }, {"x-mysolomeo-session-key":sessionId}, function(instruments){
    attrInstruments = _.map(instruments, liteInstrument);
    processedInstr = 0;
    console.log(attrInstruments.length);
    attrInstruments.forEach(function(attrInstrument){
      isHighInstrument(attrInstrument).then(function(result){
        if(result){
          greatInstruments.push(attrInstrument);
        }
        if(++processedInstr >= attrInstruments.length){
          eventEmitter.emit('processedInstruments');
        }
      }).catch(function(err){
        console.log(err);
      });
      sleep(90);
    });
  });
}

function login() {
  httpUtils.performRequest('/v1/userSessions', 'POST', {
  "appTypeID":"2026",
  "appVersion":"1.1.9",   
  "emailAddress":username,
  "ipAddress":"1.1.1.1",
  "languageID":"es_ES",
  "osType":"Windows",
  "osVersion":"NT 10.0",
  "password":password,
  "scrRes":"1366x768",
  "username":username
}, {}, function(data) {
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
      httpUtils.performRequest('/v1/bars', 'GET', 
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

function loadHistory(){

}