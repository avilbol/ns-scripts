var httpUtils = require('./httputils-dw');

var apikey = 'MHY8';
var host = 'http://www.alphavantage.co';
var endpoint = '/query';


function loadHistory(symbol, outputsize){
	return httpUtils.performGet(host, endpoint, {
		'apikey' : apikey,
		'symbol' : symbol,
		'function' : 'TIME_SERIES_DAILY',
		'outputsize' : outputsize
	},{}).catch((err) => {return Promise.reject(err)});
}

function loadOBV(symbol){
	return httpUtils.performGet(host, endpoint, {
		'apikey' : apikey,
		'symbol' : symbol,
		'function' : 'OBV',
		'interval' : 'daily'
	},{});
}

function loadMACD(symbol){
	return httpUtils.performGet(host, endpoint, {
		'apikey' : apikey,
		'symbol' : symbol,
		'function' : 'MACD',
		'interval' : 'daily',
		'series_type' : 'close'
	},{});
}

function loadCMO(symbol, timePeriod){
	return httpUtils.performGet(host, endpoint, {
		'apikey' : apikey,
		'symbol' : symbol,
		'function' : 'CMO',
		'interval' : 'daily',
		'series_type' : 'close',
		'time_period' : timePeriod
	},{});
}

function loadSMA(stockId, timePeriod){
	return httpUtils.performGet(host, endpoint, {
		'apikey' : apikey,
		'symbol' : symbol,
		'function' : 'SMA',
		'interval' : 'daily',
		'series_type' : 'close',
		'time_period' : timePeriod
	},{});
}

module.exports = {
  loadHistory : loadHistory,
  loadSMA : loadSMA,
  loadCMO : loadCMO,
  loadOBV : loadOBV,
  loadMACD : loadMACD
};