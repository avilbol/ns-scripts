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

var persistence = require('./persistence-dw');

var successToProcInstruments = [];

function start(){
	console.log("hi");
}

function createEma(instruments, days){
	var firstInstruments = _.first(instruments, days);
	var firstPrices = _.map(firstInstruments, function(instrument){
		return parseFloat(instrument.prices.close);
	});
	var amountFirst = _.reduce(firstPrices, function(last, current){
		return last + current;
	})
	var amountSeed = amountFirst/days;
	_.last(firstInstruments).indicators.ema["ema" + days] = amountSeed.toString();
	var restOfInstruments = _.last(instruments, instruments.length - days);
	var k = 2 / (days + 1);
	var lastEma = amountSeed;
	_.each(restOfInstruments, function(instrument){
		var instrumentPrice = parseFloat(instrument.prices.close);
		var instrumentEma = lastEma + k * (instrumentPrice - lastEma);
		instrument.indicators.ema["ema" + days] = instrumentEma.toString();
		lastEma = instrumentEma;
	});
}

function createMacdSignal(instruments, days){
	var instrumentsWithMacd = _.filter(instruments, function(instrument){
		return instrument.indicators.macd.value;
	});
	var firstInstruments = _.first(instrumentsWithMacd, days);
	var firstPrices = _.map(firstInstruments, function(instrument){
		return parseFloat(instrument.indicators.macd.value);
	});
	var amountFirst = _.reduce(firstPrices, function(last, current){
		return last + current;
	})
	var amountSeed = amountFirst/days;
	_.last(firstInstruments).indicators.macd.signal = amountSeed.toString();
	var restOfInstruments = _.last(instrumentsWithMacd, instruments.length - days);
	var k = 2 / (days + 1);
	var lastMacdSignal = amountSeed;
	_.each(restOfInstruments, function(instrument){
		var instrumentMacd = parseFloat(instrument.indicators.macd.value);
		var instrumentMacdSignal = lastMacdSignal + k * (instrumentMacd - lastMacdSignal);
		instrument.indicators.macd.signal = instrumentMacdSignal.toString();
		console.log("Signal " + instrumentMacdSignal);
		lastMacdSignal = instrumentMacdSignal;
	});
}

function createMacd(instruments, op1, op2){
	_.each(instruments, function(instrument){
		var emaLeft = instrument.indicators.ema["ema" + op1];
		var emaRight = instrument.indicators.ema["ema" + op2];
		if(emaLeft && emaRight){
			var macdValue = parseFloat(emaLeft) - parseFloat(emaRight);
			instrument.indicators.macd.value = macdValue.toString();
			console.log(instrument.indicators.macd.value);
		}
	});
}

function createMacdHistogram(instruments){
	_.each(instruments, function(instrument){
		var macdValue = instrument.indicators.macd.value;
		var macdSignal = instrument.indicators.macd.signal;
		if(macdValue && macdSignal){
			var macdHistogramItem = parseFloat(macdValue) - parseFloat(macdSignal);
			instrument.indicators.macd.histogramItem =  macdHistogramItem;
		}
		 
	});
}

function loadSymbolData(symbol){
	persistence.getStockEntries(symbol).then(function(instruments){
		createEma(instruments, 12);
		createEma(instruments, 26);
		createMacd(instruments, 12, 26);
		createMacdSignal(instruments, 9);
		createMacdHistogram(instruments);
		persistence.loadMongoDb().close();
	}).catch(function(err){
		console.log(err);
	});
}

function start(){
	persistence.getSymbols().then(function(symbols){
		symbols = symbols.sort();
		_.each(symbols, (symbol)=>{
			console.log("processing symbol: " + symbol);
			loadSymbolData(symbol);
		});
	}).catch((err) => {console.log(err)});
}


start();

//loadSymbolData("ALE");