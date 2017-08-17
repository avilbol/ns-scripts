var strategyA = require('./strategies/strategyA');
var strategyDao = require('./strategies/strategies-dao');

var program = {
	daysPassed = 0,
	distribution: []
}

var result = {};

var config = {
	comission:{
		in:{
			fixed : 0,
			percentual : 0.04
		},
		out:{
			fixed : 0,
			percentual : 0.04
		}
	},
	conditions:{
		finishbt:{
			percent: 0.7,
			lastDate: '2017-07-06T12:00:00'
		}
	},
	generics:{
		patrimony:2000,
		actions:7,
		initIn:'2001-01-01T12:00:00'
	}
}

function backtest(){
	var initDate = new Date(Date.parse(config.generics.initIn));
	for (var d = initDate; d <= Date.now(); d.setDate(d.getDate() + 1)) {
		processDate(new Date(d));
	    console.log(new Date(d).toISOString().substring(0,10));
	}
}

function processDate(d){
	var date = new Date(d);
	var monthDay = date.getDate();
	var monthNumber = date.getMonth() + 1;
	var year = date.getFullYear();
	var shortDate = date.toISOString().substring(0,10);
	if(monthDay == 31 && monthNumber == 12){
		logEndYearStatistics(year);
	}
	if(d == Date.now()){
		logFinalStatistics();
		return;
	}
	operate(shortDate);
	d.setDate(d.getDate() + 1)
	processDate(d);
}



function logFinalStatistics(){

}

function logEndYearStatistics(year){

}

function operate(d){
	var shortDate = date.toISOString().substring(0,10);
	result[shortDate] = {};
	var rep = result[shortDate];
}

backtest();