var querystring = require('querystring');
var https = require('https');
var rp = require('request-promise');

var http = require('http');
var httpAgent = new http.Agent();
httpAgent.maxSockets = 50;

function reviewResponse(response) {
  return new Promise((resolve, reject) => {
    if(response.statusCode < 200 || response.statusCode > 299) 
      reject("Error: " + response.statusCode + "," + response.body);
    else
      resolve(response.body);
  });
}


function defineOptions(host, endpoint, method, data, headers, secure) {
  var dataString = JSON.stringify(data);
  var headers = headers || {};
  if(method == 'GET'){
    endpoint += '?' + querystring.stringify(data);
  }
  else{
    headers['Content-Type'] = 'application/json',
    headers['Content-Length'] =  dataString.length
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers,
    rejectUnauthorized: secure,
    dataString : dataString
  };
  return options;
}

function doGet(options, success, error){
  options.httpAgent = httpAgent;
  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';
    if(res.statusCode < 200 || res.statusCode > 299){
      error(statusCode);
    }
    else{
      res.on('data', function(data) {
        responseString += data;
      });

      res.on('end', function() {
        var responseObject = JSON.parse(responseString);
        success(responseObject);
      });
    }
  });

  req.on('error', function(err) {
    error(err);
  });


  req.write(options.dataString);
  req.end();
}

var performSecureRequest = function (host, endpoint, method, data, headers, success, error) {
  doGet(defineOptions(host, endpoint, method, data, headers, true), success, error)
};

var performGet = function (host, endpoint, qs, headers) {
  var options = {
    uri: host + "/" + endpoint,
    qs: qs,
    headers: headers,
    json: true,
    resolveWithFullResponse: true,
    pool: httpAgent
  };
  return rp(options).then(reviewResponse).catch(consoleErr);
}

var consoleErr = function (err){
  console.log("Error in HTTP-UTILS!!!!!!!!!!!" + err);
  return Promise.reject(err);
}

var performPost = function (host, endpoint, qs, headers, body) {
  var options = {
    uri: host + "/" + endpoint,
    qs: qs,
    method : "POST",
    body: body,
    headers: headers,
    json: true,
    resolveWithFullResponse: true,
    pool: httpAgent
  };
  return rp(options).then(reviewResponse).catch(consoleErr);
}

module.exports = {
  performGet : performGet,
  performPost: performPost,
  performSecureRequest : performSecureRequest
};


performGet("http://www.alphavantage.co", "query", {
  "function" : "TIME_SERIES_DAILY",
  "symbol" : "ALE",
  "apikey" : "MHY8",
  "outputsize" : "compact"
},{}).then((response) => {
  //console.log(response);
}).catch((err) => {console.log("Error: " + err)});

var username = "alxvilbol";
var password = "Inversion123";
performPost("https://api.drivewealth.net", 'v1/userSessions', {},
  {
    "Content-Type": "application/json"
  },
  {
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
  } 
).then((response) => {
  console.log(response.sessionKey);
});

