var f1 = function(){
	return new Promise(function(resolve, reject){
		resolve("hola");
	});
}

var f2 = function(){
	return f1().then(function(r){
		console.log(r);
	});
}

f2().then(function(){
	console.log("Esto debería ir al final");
});


var persistence = require('./persistence-dw');
var async = require("async");

var items = ["A", "ALE", "STMP"];
items.forEach(
  // 2nd param is the function that each item is passed to
  function(item){
    // Call an asynchronous function, often a save() to DB
    console.log(item);
    var entries = await persistence.getStockEntries(item);
    console.log(entries.length);
  }
);

function hola() {
  // agregando nueva funcion
}