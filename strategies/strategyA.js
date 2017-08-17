
var name = "strategyA";
var strategyResult = [];

var strategyConfig = 
	{
		"tnd": {
			"weight":0.1,
			"rateFunc":rateTnd,
		},
		"sma": {
			"weight":0.2,
			"rateFunc":rateSma,
		},
		"cmo": {
			"weight":0.2,
			"rateFunc":rateCmo,
		},
		"macd": {
			"weight":0.25,
			"rateFunc":rateMacd,
		},
		"obv": {
			"weight":0.25,
			"rateFunc":rateObv,
			"additionalParameters":{
				"historyDays": 5
			}
		},
		"additional": {
			"overrate": true,
			"rateFunc":calculateAdditional,
		}
	};

function rate(stockList){
	var rates = [];
	for(index in stockList){
		rates.push(rateStock(stockList[index]));
	}
	return rates;
}

function stopInv(stockItem){
	var close = stockItem.prices.close;
	var sma = stockItem.indicators.sma;
	if(close == null || sma == null) return true;
	var percent = parseFloat(close)/parseFloat(sma)*100;
	return percent >= 95;
}

function getName(){
	return name;
}

function rateStock(stock){
	var rateObj = {_id : stock._id, total : 0};
	for(strategyProperty in strategyConfig){
		var strategyEntry = strategyConfig[strategyProperty];
		var rate = strategyEntry.rateFunc(strategyEntry.overrate ? rateObj : stock, strategyEntry.additionalParameters);
		rateObj[strategyProperty] = rate;
		rateObj.total += rate * (strategyEntry.overrate ? 1 : strategyEntry.weight);
	}
	return rateObj;
}

function rateSma(stock){
	var close = stock.prices.close;
	var sma = stock.indicators.sma;
	if(close == null || !sma) return 0;
	var percent = parseFloat(close)/parseFloat(sma)*100;
	if(percent <= 100) return 4;
	if(percent <= 101) return 6;
	if(percent <= 102) return 7
	if(percent <= 103) return 8;
	if(percent <= 104) return 9;
	if(percent <= 106) return 10;
	if(percent <= 108) return 9;
	if(percent <= 110) return 8;
	return 7;
}

function rateCmo(stock){
	var cmo = stock.indicators.cmo;
	if(cmo == null) return 0;
	cmo = parseFloat(cmo);
	if(cmo <= 0) return 5;
	if(cmo <= 5) return 6;
	if(cmo <= 15) return 7;
	if(cmo <= 25) return 8;
	if(cmo <= 40) return 9;
	return 10;
}

function rateTnd(stock){
	var tnd = stock.indicators.tnd;
	if(!tnd) return 0;
	tnd = parseInt(tnd);
	if(tnd == 0) return 5;
	if(tnd == 1) return 6;
	if(tnd == 2 || tnd > 10) return 7;
	if(tnd == 3 || tnd == 9 || tnd == 10) return 8;
	if(tnd == 4 || tnd == 7 || tnd == 8) return 9;
	if(tnd == 5 || tnd == 6) return 10;
	return 0;
}

function rateMacd(stock){
	var macd = stock.indicators.macd.value;
	var signal = stock.indicators.macd.signal;
	if(macd == null || signal == null) return 0;
	var percent = parseFloat(macd)/parseFloat(signal)*100;
	if(percent <= 100) return 5;
	if(percent <= 105) return 6;
	if(percent <= 110) return 7
	if(percent <= 120) return 8;
	if(percent <= 140) return 9;
	return 10;
}

function rateObv(stock, additionalParameters){
	var obvHistoryProperty = "obvm5";
	if(additionalParameters.historyDays == 5) obvHistoryProperty = "obvm5";
	if(additionalParameters.historyDays == 10) obvHistoryProperty = "obvm10";
	if(additionalParameters.historyDays == 15) obvHistoryProperty = "obvm15";
	var initObv = stock.indicators[obvHistoryProperty];
	var lastObv = stock.indicators.obv;
	var percent = parseFloat(lastObv)/parseFloat(initObv)*100;
	if(initObv == null) return 0;
	if(percent <= 100) return 5;
	if(percent <= 105) return 6;
	if(percent <= 110) return 7
	if(percent <= 120) return 8;
	if(percent <= 140) return 9;
	return 10;
}

function calculateAdditional(stockRates){
	var grantAdditionalPoint = true;
	for(strategyProperty in strategyConfig){
		var rate = stockRates[strategyProperty];
		grantAdditionalPoint = grantAdditionalPoint && (rate==null || rate >= 6);
	}
	return grantAdditionalPoint ? 1 : 0;
}

module.exports = {
  rate : rate,
  stopInv : stopInv,
  getName : getName
};