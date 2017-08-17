var persistence = require('../persistence-dw');
var strategyA = require('./strategyA');
var strategyDao = require('./strategies-dao');

function start(){
	persistence.getSymbols().then(processSymbols).catch(manageErr);
}

function processSymbols(symbols, index, strategyRates){
	strategyRates = strategyRates != null ? strategyRates : [];
	index = index | 0;
	var symbol = symbols[index];
	persistence.getStockEntries(symbol).then(stockList => {
		console.log("Processing symbol: " + symbol);
		console.log("Index: " + index);
		buildStrategyRates(symbols, strategyRates, index, stockList);
	}).catch(manageErr);
	
}

function buildStrategyRates(symbols, strategyRates, index, stockList){
	persistence.closeConnection();
	var newStrategyRates = strategyA.rate(stockList);
	Array.prototype.push.apply(strategyRates, newStrategyRates);
	if((index > 0 || index + 1  == symbols.length) && index % 30 == 0){
		console.log("Persisting data");
		updateStrategyRates(strategyA.getName(), strategyRates);	
		strategyRates = [];
	}
	if(index < symbols.length - 1){
		processSymbols(symbols, index + 1, strategyRates);
	}
	
}

function updateStrategyRates(strategyName, strategyRates){
	strategyDao.updateStrategyRates(strategyName, strategyRates).then(()=>{
		strategyDao.closeConnection();
	}).catch(manageErr);
}

var manageErr = err => console.log(err);

start();