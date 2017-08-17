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
		lastMacdSignal = instrumentMacdSignal;
	});
}

function createSma(instruments, days){
	var index = 0;
	var arrayValues = [];
	for(var i = 0; i< days ; i++){
		arrayValues.push(0);
	}
	_.each(instruments, function(instrument){
		var index = instruments.indexOf(instrument);
		arrayValues[index % days] = instrument.prices.close;
		var sumArray = _.reduce(arrayValues, function(last, current){
			return parseFloat(last) + parseFloat(current);
		})
		instrument.indicators.sma = index < days ? 0 : sumArray/days;
	});
}

function createMacd(instruments, op1, op2){
	_.each(instruments, function(instrument){
		var emaLeft = instrument.indicators.ema["ema" + op1];
		var emaRight = instrument.indicators.ema["ema" + op2];
		if(emaLeft && emaRight){
			var macdValue = parseFloat(emaLeft) - parseFloat(emaRight);
			instrument.indicators.macd.value = macdValue.toString();
		}
	});
}

function createObv(instruments, index){
	index = index | 0;
	var instrument = instruments[index];
	if(index == 0){
		instrument.indicators.obv = 0;
	}
	else{
		var lastInstrument = instruments[index - 1];
		var lastClose = lastInstrument.prices.close;
		var close = instrument.prices.close;
		var multiplier = lastClose == close ? 0 : (lastClose < close ? 1 : -1);
		instrument.indicators.obv = lastInstrument.indicators.obv + instrument.volume * multiplier;
	}
	if(index < instruments.length - 1){
		createObv(instruments, ++index);
	}
}

function createObvHistory(instruments){
	_.each(instruments, instrument => {
		var index = instruments.indexOf(instrument);
		if(instruments[index + 5])
			instruments[index + 5].indicators.obvm5 = instrument.indicators.obv;
		if(instruments[index + 10])
			instruments[index + 10].indicators.obvm10 = instrument.indicators.obv;
		if(instruments[index + 15])
			instruments[index + 15].indicators.obvm15 = instrument.indicators.obv;
	});
}

function createTnd(instruments){
	var lastInstrument = null;
	var upDay = null;
	_.each(instruments, function(instrument){
		if(instruments.indexOf(instrument) > 0){
			upDay = instrument.prices.close >= lastInstrument.prices.close;
		}
		instrument.indicators.tnd = upDay ? lastInstrument.indicators.tnd + 1 : 0;
		lastInstrument = instrument;
	});
}

function createCmo(instruments, days){
	_.each(instruments, function(instrument){
		var index = instruments.indexOf(instrument);
		if(index < days){
			instrument.indicators.cmo = 0;
		}
		else{
			instrument.indicators.cmo = calculateCmo(instruments.slice(index - days, index + 1));
		}
	});
}

function calculateCmo(instruments){
	var positiveMovs = 0
;	var negativeMovs = 0;
	var lastClose = undefined;
	for(var i = 0; i < instruments.length; i++){
		var instrument = instruments[i];
		var close = instrument.prices.close;
		if(lastClose){
			var diff = close - lastClose;
			positiveMovs += diff > 0 ? diff : 0;
			negativeMovs += diff < 0 ? (diff * -1) : 0;
		}
		lastClose = close;
	}
	return ((positiveMovs - negativeMovs) / (positiveMovs + negativeMovs)) * 100;
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

function loadSymbolsData(symbols, processedStocks, index){
	var index = index | 0;
	var symbol = symbols[index];
	var processedStocks = processedStocks == null ? [] : processedStocks;
	persistence.getStockEntries(symbol).then(function(instruments){
		createIndicators(instruments);
		persistence.closeConnection();
		console.log("processed symbol: " + symbol);
		console.log("current index: " + index);
		Array.prototype.push.apply(processedStocks, instruments);
		var isLastIndex = index == symbols.length - 1;
		if((index > 0 && index % 30 == 0) || isLastIndex){
			console.log("Persisting indicators");
			updateStockList(processedStocks, isLastIndex);
			processedStocks = [];
		}
		if(index < symbols.length - 1)
			loadSymbolsData(symbols, processedStocks, index + 1);
	}).catch(function(err){
		console.log(err);
	});
}

function createIndicators(instruments){
	createEma(instruments, 12);
	createEma(instruments, 26);
	createCmo(instruments, 15);
	createObv(instruments);
	createObvHistory(instruments);
	createSma(instruments, 15);
	createMacd(instruments, 12, 26);
	createMacdSignal(instruments, 9);
	createMacdHistogram(instruments);
	createTnd(instruments);
}

function updateStockList(stockList, finishConnection){
	persistence.updateStockList(stockList).then(()=>{
		if(finishConnection){
			persistence.closeConnection();
		}
	}).catch(err => console.log(err));
}

function start(){
	persistence.getSymbols().then(function(symbols){
		loadSymbolsData(symbols.sort());
	}).catch((err) => {console.log(err)});
}

/*function persistStocks(processedStocks){
  console.log("Persisting indicators");
  var counter = 0;
  var length = processedStocks.length
  while(counter < length){
  	var nextCounter = counter + 100000;
  	var nextIndex = nextCounter < length ? nextCounter : length;
  	console.log("Processing " + counter + ", " + nextIndex + " positions");
  	var stocksToPersist = processedStocks.slice(counter, nextIndex);
  	updateStockList(stocksToPersist);
  	counter = nextCounter;
  }
};*/



start();

//loadSymbolsData(["ALE"]);